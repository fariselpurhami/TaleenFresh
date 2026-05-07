// src/app/api/webhooks/paymob/worker/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SAAS_COMMISSION_RATE = 0.025; 

async function processPayment(payload: any) {
  const orderId = payload.obj.order.merchant_order_id;
  const isSuccess = payload.obj.success === true;
  const amountCents = payload.obj.amount_cents;

  if (!isSuccess) return;

  const totalAmount = amountCents / 100;
  const saasRevenue = totalAmount * SAAS_COMMISSION_RATE;
  const merchantRevenue = totalAmount - saasRevenue;

  const { error: rpcError } = await supabaseAdmin.rpc('process_order_payment_atomic', {
    p_order_id: orderId,
    p_status: 'paid',
    p_saas_revenue: saasRevenue,
    p_merchant_revenue: merchantRevenue
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }
}

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();

    const { data: event, error: fetchError } = await supabaseAdmin
      .from('payment_events')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ status: 'ignored' });
    }

    try {
      await processPayment(event.payload);

      await supabaseAdmin
        .from('payment_events')
        .update({ status: 'processed' })
        .eq('transaction_id', transactionId);

      return NextResponse.json({ success: true });
    } catch (err: any) {
      const newRetryCount = event.retry_count + 1;
      const newStatus = newRetryCount >= 3 ? 'dlq' : 'pending';

      await supabaseAdmin
        .from('payment_events')
        .update({ 
          status: newStatus, 
          retry_count: newRetryCount,
          error_message: err.message 
        })
        .eq('transaction_id', transactionId);

      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Worker Error' }, { status: 400 });
  }
}
