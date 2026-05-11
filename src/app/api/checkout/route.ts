// src/app/api/checkout/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { envServer } from '@/lib/env-server';

const getSupabaseAdmin = () => {
  return createClient(envServer.NEXT_PUBLIC_SUPABASE_URL, envServer.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

interface CartItem {
  readonly name: string;
  readonly qty: number;
  readonly price: number;
}

interface CheckoutPayload {
  readonly customer_name: string;
  readonly customer_phone: string;
  readonly customer_address: string;
  readonly items: readonly CartItem[];
  readonly total_price: number;
  readonly payment_method: 'card' | 'cod';
}

function isValidCheckoutPayload(payload: unknown): payload is CheckoutPayload {
  if (!payload || typeof payload !== 'object') return false;

  const p = payload as Record<string, unknown>;

  if (typeof p.customer_name !== 'string' || !p.customer_name.trim()) return false;
  if (typeof p.customer_phone !== 'string' || !p.customer_phone.trim()) return false;
  if (typeof p.customer_address !== 'string' || !p.customer_address.trim()) return false;
  if (typeof p.total_price !== 'number' || p.total_price < 0 || isNaN(p.total_price)) return false;
  if (p.payment_method !== 'card' && p.payment_method !== 'cod') return false;

  if (!Array.isArray(p.items) || p.items.length === 0) return false;

  for (const item of p.items) {
    if (!item || typeof item !== 'object') return false;
    if (typeof item.name !== 'string' || !item.name.trim()) return false;
    if (typeof item.qty !== 'number' || item.qty <= 0 || !Number.isInteger(item.qty)) return false;
    if (typeof item.price !== 'number' || item.price < 0 || isNaN(item.price)) return false;
  }

  return true;
}

async function handlePaymobOrchestration(
  orderId: string,
  amount: number,
  customer: { firstName: string; lastName: string; phone: string; address: string },
  items: readonly CartItem[]
): Promise<string> {
  if (!envServer.PAYMOB_API_KEY || !envServer.PAYMOB_INTEGRATION_ID || !envServer.PAYMOB_IFRAME_ID) {
    throw new Error('Missing Paymob environment variables in env.ts');
  }

  const amountCents = Math.round(amount * 100);

  const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: envServer.PAYMOB_API_KEY }),
    cache: 'no-store',
  });

  if (!authRes.ok) {
    const errData = await authRes.text();
    throw new Error(`Paymob auth failed: ${errData}`);
  }

  const { token: authToken } = await authRes.json() as { token: string };

  const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: orderId,
      items: items.map(i => ({ name: i.name, amount_cents: Math.round(i.price * 100).toString(), description: "Product", quantity: i.qty.toString() })),
    }),
    cache: 'no-store',
  });

  if (!orderRes.ok) {
    const errData = await orderRes.text();
    throw new Error(`Paymob order registration failed: ${errData}`);
  }

  const { id: paymobOrderId } = await orderRes.json() as { id: number };

  const paymentKeyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: {
        apartment: 'NA',
        email: 'checkout@taleenfresh.com',
        floor: 'NA',
        first_name: customer.firstName,
        street: customer.address,
        building: 'NA',
        phone_number: customer.phone,
        shipping_method: 'NA',
        postal_code: 'NA',
        city: 'Cairo',
        country: 'EG',
        last_name: customer.lastName,
        state: 'Cairo',
      },
      currency: 'EGP',
      integration_id: Number(envServer.PAYMOB_INTEGRATION_ID),
    }),
    cache: 'no-store',
  });

  if (!paymentKeyRes.ok) {
    const errData = await paymentKeyRes.text();
    throw new Error(`Paymob payment key generation failed: ${errData}`);
  }

  const { token: paymentToken } = await paymentKeyRes.json() as { token: string };

  return `https://accept.paymob.com/api/acceptance/iframes/${envServer.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
}

export async function POST(req: Request) {
  try {
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

    if (!isValidCheckoutPayload(rawBody)) {
      return NextResponse.json({ error: 'Invalid or missing checkout fields' }, { status: 400 });
    }

    const payload = rawBody;

    const orderData = {
      customer_name: payload.customer_name.trim(),
      customer_phone: payload.customer_phone.trim(),
      customer_address: payload.customer_address.trim(),
      items: payload.items.map((item) => ({
        name: item.name.trim(),
        qty: item.qty,
        price: item.price,
      })),
      total_price: payload.total_price,
      status: 'pending',
      payment_method: payload.payment_method,
    };

    const supabaseAdmin = getSupabaseAdmin();

    const { data: insertedOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select('id')
      .single();

    if (insertError || !insertedOrder) {
      console.error('[Checkout Route] Database insert failed:', insertError);
      return NextResponse.json({ error: 'Failed to create order in database' }, { status: 500 });
    }

    if (payload.payment_method === 'cod') {
      return NextResponse.json({ success: true, orderId: insertedOrder.id }, { status: 201 });
    }

    const nameParts = payload.customer_name.trim().split(' ').filter(Boolean);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    try {
      const paymentUrl = await handlePaymobOrchestration(
        insertedOrder.id,
        payload.total_price,
        {
          firstName,
          lastName,
          phone: payload.customer_phone.trim(),
          address: payload.customer_address.trim() || 'NA'
        },
	payload.items
      );

      return NextResponse.json({ success: true, orderId: insertedOrder.id, url: paymentUrl }, { status: 201 });
    } catch (paymobError) {
      console.error('[Checkout Route] Paymob orchestration failed:', paymobError);
      return NextResponse.json({ error: 'Payment gateway integration failed' }, { status: 502 });
    }

  } catch (error) {
    console.error('[Checkout Route] Unhandled exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
