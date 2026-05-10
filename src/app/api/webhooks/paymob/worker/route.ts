// src/app/api/webhooks/paymob/worker/route.ts

import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SAAS_COMMISSION_RATE = 0.025;
const MAX_RETRY_COUNT = 3;

function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL: Missing required environment variable: ${key}`);
  }
  return value;
}

function getSupabaseAdminClient(): SupabaseClient {
  return createClient(
    getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}

interface PaymentEvent {
  readonly transaction_id: string;
  readonly payload: unknown;
  readonly status: 'pending' | 'processed' | 'dlq';
  readonly retry_count: number;
}

interface PaymobObjPayload {
  readonly success: boolean;
  readonly amount_cents: number;
  readonly order?: {
    readonly merchant_order_id?: string;
  };
}

function extractWorkerPayload(rawBody: unknown): string | null {
  if (!rawBody || typeof rawBody !== 'object') return null;
  const p = rawBody as Record<string, unknown>;
  return typeof p.transactionId === 'string' && p.transactionId.trim() !== ''
    ? p.transactionId
    : null;
}

function extractPaymentDetails(payload: unknown): PaymobObjPayload | null {
  if (!payload || typeof payload !== 'object') return null;

  const p = payload as Record<string, unknown>;
  if (!p.obj || typeof p.obj !== 'object') return null;

  const obj = p.obj as Record<string, unknown>;

  const success = obj.success;
  const amount_cents = obj.amount_cents;
  const order = obj.order as Record<string, unknown> | undefined;

  if (typeof success !== 'boolean') return null;
  if (typeof amount_cents !== 'number' || isNaN(amount_cents)) return null;

  return {
    success,
    amount_cents,
    order: order ? { merchant_order_id: String(order.merchant_order_id) } : undefined,
  };
}

async function processPayment(supabaseAdmin: SupabaseClient, payload: unknown): Promise<void> {
  const details = extractPaymentDetails(payload);

  if (!details) {
    throw new Error('Invalid or unprocessable Paymob payload structure in database event.');
  }

  if (!details.success) {
    console.info(`[Payment Worker] Payment marked as unsuccessful in payload. Skipping financial updates.`);
    return;
  }

  const orderId = details.order?.merchant_order_id;
  if (!orderId) {
    throw new Error('Missing merchant_order_id in Paymob payload.');
  }

  const totalAmount = details.amount_cents / 100;

  const rawSaasRevenue = totalAmount * SAAS_COMMISSION_RATE;
  const saasRevenue = Math.round(rawSaasRevenue * 100) / 100;
  const merchantRevenue = Math.round((totalAmount - saasRevenue) * 100) / 100;

  const { error: rpcError } = await supabaseAdmin.rpc('process_order_payment_atomic', {
    p_order_id: orderId,
    p_status: 'paid',
    p_saas_revenue: saasRevenue,
    p_merchant_revenue: merchantRevenue,
  });

  if (rpcError) {
    console.error(`[Payment Worker] RPC call failed for order ${orderId}:`, rpcError);
    throw new Error(`Database transaction failed: ${rpcError.message}`);
  }
}

export async function POST(req: Request) {
  try {
    const workerSecretToken = getRequiredEnvVar('WORKER_SECRET_TOKEN');
    const authHeader = req.headers.get('authorization');

    if (!authHeader || authHeader !== `Bearer ${workerSecretToken}`) {
      console.warn('[Payment Worker] Unauthorized invocation attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const transactionId = extractWorkerPayload(rawBody);
    if (!transactionId) {
      console.error('[Payment Worker] Missing or invalid transactionId in worker payload.');
      return NextResponse.json({ error: 'Unprocessable Entity' }, { status: 422 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    const { data: eventData, error: fetchError } = await supabaseAdmin
      .from('payment_events')
      .select('transaction_id, payload, status, retry_count')
      .eq('transaction_id', transactionId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !eventData) {
      console.info(`[Payment Worker] Event ${transactionId} not found or already processed.`);
      return NextResponse.json({ status: 'ignored', reason: 'Not found or not pending' }, { status: 200 });
    }

    const event = eventData as PaymentEvent;

    try {
      await processPayment(supabaseAdmin, event.payload);

      const { error: updateError } = await supabaseAdmin
        .from('payment_events')
        .update({ status: 'processed', error_message: null })
        .eq('transaction_id', transactionId);

      if (updateError) {
        console.error(`[Payment Worker] Failed to mark event ${transactionId} as processed:`, updateError);
        return NextResponse.json({ error: 'State synchronization failed' }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (processingError) {
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error';
      console.error(`[Payment Worker] Failed to process transaction ${transactionId}:`, errorMessage);

      const newRetryCount = event.retry_count + 1;
      const newStatus = newRetryCount >= MAX_RETRY_COUNT ? 'dlq' : 'pending';

      const { error: fallbackError } = await supabaseAdmin
        .from('payment_events')
        .update({
          status: newStatus,
          retry_count: newRetryCount,
          error_message: errorMessage,
        })
        .eq('transaction_id', transactionId);

      if (fallbackError) {
        console.error(`[Payment Worker] CRITICAL: Failed to update failure state for tx ${transactionId}:`, fallbackError);
      }

      if (newStatus === 'dlq') {
        console.warn(`[Payment Worker] Transaction ${transactionId} moved to Dead Letter Queue.`);
      }

      return NextResponse.json({ error: 'Processing failed', retry: newStatus !== 'dlq' }, { status: 500 });
    }
  } catch (globalError) {
    console.error('[Payment Worker] Unhandled exception in worker route:', globalError);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
