// src/app/api/webhooks/paymob/route.ts

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { after } from 'next/server';

function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL: Missing required environment variable: ${key}`);
  }
  return value;
}

function getSupabaseAdminClient() {
  return createClient(
    getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

interface PaymobPayload {
  readonly obj?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

const PAYMOB_HMAC_KEYS: readonly string[] = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
];

function extractNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function verifyPaymobHmac(payload: PaymobPayload, receivedHmac: string): boolean {
  if (!payload || typeof payload !== 'object' || !payload.obj) {
    return false;
  }

  const hmacSecret = getRequiredEnvVar('PAYMOB_HMAC_SECRET');

  const dataString = PAYMOB_HMAC_KEYS.map((key) => {
    const val = extractNestedValue(payload.obj as Record<string, unknown>, key);
    if (typeof val === 'boolean') {
      return val.toString();
    }
    return val === undefined || val === null ? '' : String(val);
  }).join('');

  const calculatedHmac = crypto
    .createHmac('sha512', hmacSecret)
    .update(dataString)
    .digest('hex');

  try {
    const calculatedBuffer = Buffer.from(calculatedHmac, 'utf8');
    const receivedBuffer = Buffer.from(receivedHmac, 'utf8');

    if (calculatedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(calculatedBuffer, receivedBuffer);
  } catch (error) {
    console.error('[Paymob Webhook] Error during HMAC comparison', error);
    return false;
  }
}

async function triggerBackgroundWorker(transactionId: string): Promise<void> {
  try {
    const appUrl = getRequiredEnvVar('NEXT_PUBLIC_APP_URL');
    const workerToken = getRequiredEnvVar('WORKER_SECRET_TOKEN');
    const workerUrl = new URL('/api/webhooks/paymob/worker', appUrl);

    fetch(workerUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ transactionId }),
      keepalive: true,
    }).catch((error) => {
      console.error(`[Paymob Webhook] Failed to trigger background worker for tx ${transactionId}:`, error);
    });
  } catch (error) {
    console.error(`[Paymob Webhook] Error preparing background worker trigger for tx ${transactionId}:`, error);
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
    }

    let payload: PaymobPayload;
    try {
      payload = (await req.json()) as PaymobPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const url = new URL(req.url);
    const receivedHmac = url.searchParams.get('hmac') || req.headers.get('hmac');

    if (!receivedHmac || typeof receivedHmac !== 'string' || !verifyPaymobHmac(payload, receivedHmac)) {
      console.warn('[Paymob Webhook] Unauthorized attempt: Invalid or missing HMAC.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payload.obj || typeof payload.obj.id === 'undefined' || payload.obj.id === null) {
      console.error('[Paymob Webhook] Invalid payload structure: Missing transaction ID.');
      return NextResponse.json({ error: 'Unprocessable Entity' }, { status: 422 });
    }

    const transactionId = String(payload.obj.id);
    const supabaseAdmin = getSupabaseAdminClient();

    const { error: insertError } = await supabaseAdmin.from('payment_events').insert({
      transaction_id: transactionId,
      payload: payload,
      status: 'pending',
      retry_count: 0,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        console.info(`[Paymob Webhook] Duplicate transaction ID ignored: ${transactionId}`);
        return NextResponse.json({ success: true, message: 'Duplicate acknowledged' }, { status: 200 });
      }
      
      console.error(`[Paymob Webhook] Database insert failed for tx ${transactionId}:`, insertError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    after(() => {
      triggerBackgroundWorker(transactionId);
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Paymob Webhook] Unhandled exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
