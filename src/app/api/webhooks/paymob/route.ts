// src/app/api/webhooks/paymob/route.ts

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyPaymobHmac(payload: any, receivedHmac: string): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET!;
  const keys = [
    'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
    'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
    'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending', 'source_data.pan',
    'source_data.sub_type', 'source_data.type', 'success'
  ];

  const dataString = keys.map(key => {
    const parts = key.split('.');
    let val = payload.obj;
    for (const p of parts) {
      val = val?.[p];
    }
    return val === undefined || val === null ? '' : val;
  }).join('');

  const calculatedHmac = crypto.createHmac('sha512', secret).update(dataString).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, 'utf8'),
      Buffer.from(receivedHmac, 'utf8')
    );
  } catch {
    return false;
  }
}

async function triggerBackgroundWorker(transactionId: string) {
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paymob/worker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId })
  }).catch(() => {});
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const url = new URL(req.url);
    const receivedHmac = url.searchParams.get('hmac') || req.headers.get('hmac');

    if (!receivedHmac || !verifyPaymobHmac(payload, receivedHmac)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactionId = payload.obj.id.toString();

    const { error: insertError } = await supabaseAdmin.from('payment_events').insert({
      transaction_id: transactionId,
      payload: payload,
      status: 'pending',
      retry_count: 0
    });

    if (insertError && insertError.code !== '23505') {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    triggerBackgroundWorker(transactionId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
