// src/app/api/checkout/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { envServer } from '@/lib/env-server';
import { randomUUID } from 'crypto';

const DELIVERY_FEE_EGP = 25;
const MAX_PAYLOAD_ITEMS = 50;
const MAX_QTY_PER_ITEM = 100;
const PAYMENT_CACHE_NO_STORE = 'no-store';

interface CartItem {
  readonly name: string;
  readonly qty: number;
}

interface SecureCartItem extends CartItem {
  readonly price: number;
}

interface CheckoutPayload {
  readonly customer_name: string;
  readonly customer_phone: string;
  readonly customer_address: string;
  readonly items: readonly CartItem[];
  readonly payment_method: 'card' | 'cod';
}

interface CustomerContext {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly address: string;
}

const createStructuredLog = (
  level: 'INFO' | 'WARN' | 'ERROR',
  traceId: string,
  message: string,
  context?: Record<string, unknown>
): void => {
  const logMethod = console[level.toLowerCase() as 'info' | 'warn' | 'error'];
  logMethod(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      traceId,
      message,
      ...context,
    })
  );
};

const sanitizeInput = (val: string, maxLength: number): string => {
  return val.replace(/[<>]/g, '').trim().substring(0, maxLength);
};

const isValidCheckoutPayload = (payload: unknown): payload is CheckoutPayload => {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;

  if (typeof p.customer_name !== 'string' || !p.customer_name.trim() || p.customer_name.length > 100) return false;
  if (typeof p.customer_phone !== 'string' || !/^\+?\d{10,20}$/.test(p.customer_phone.replace(/\s+/g, ''))) return false;
  if (typeof p.customer_address !== 'string' || !p.customer_address.trim() || p.customer_address.length > 500) return false;
  if (p.payment_method !== 'card' && p.payment_method !== 'cod') return false;

  if (!Array.isArray(p.items) || p.items.length === 0 || p.items.length > MAX_PAYLOAD_ITEMS) return false;

  for (const item of p.items) {
    if (!item || typeof item !== 'object') return false;
    if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 200) return false;
    if (typeof item.qty !== 'number' || !Number.isInteger(item.qty) || item.qty <= 0 || item.qty > MAX_QTY_PER_ITEM) return false;
  }

  return true;
};

const getSupabaseAdmin = () => {
  return createClient(envServer.NEXT_PUBLIC_SUPABASE_URL, envServer.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

const fetchVerifiedPricing = async (
  items: readonly CartItem[],
  traceId: string
): Promise<{ secureItems: SecureCartItem[]; secureTotalPrice: number } | null> => {
  const supabaseAdmin = getSupabaseAdmin();
  const uniqueNames = Array.from(new Set(items.map(i => i.name)));

  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('name, price')
    .in('name', uniqueNames);

  if (error || !products || products.length !== uniqueNames.length) {
    createStructuredLog('ERROR', traceId, 'Pricing verification failed or products missing', { error, uniqueNames });
    return null;
  }

  const productMap = new Map<string, number>(products.map(p => [p.name, p.price]));
  const secureItems: SecureCartItem[] = [];
  let secureTotalPrice = DELIVERY_FEE_EGP;

  for (const item of items) {
    const price = productMap.get(item.name);
    if (price === undefined || price < 0 || !Number.isFinite(price)) return null;
    
    secureItems.push({ name: item.name, qty: item.qty, price });
    secureTotalPrice += price * item.qty;
  }

  return { secureItems, secureTotalPrice };
};

const handlePaymobOrchestration = async (
  orderId: string,
  amount: number,
  customer: CustomerContext,
  items: readonly SecureCartItem[],
  traceId: string
): Promise<string> => {
  if (!envServer.PAYMOB_API_KEY || !envServer.PAYMOB_INTEGRATION_ID || !envServer.PAYMOB_IFRAME_ID) {
    throw new Error('Missing external payment gateway configuration');
  }

  const amountCents = Math.round(amount * 100);
  const jsonHeaders = { 'Content-Type': 'application/json' };

  const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ api_key: envServer.PAYMOB_API_KEY }),
    cache: PAYMENT_CACHE_NO_STORE,
  });

  if (!authRes.ok) {
    createStructuredLog('ERROR', traceId, 'Payment gateway authentication failed', { status: authRes.status });
    throw new Error('Gateway Authentication Failure');
  }

  const { token: authToken } = await authRes.json() as { token: string };

  const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: orderId,
      items: items.map(i => ({
        name: i.name,
        amount_cents: Math.round(i.price * 100).toString(),
        description: 'Product',
        quantity: i.qty.toString(),
      })),
    }),
    cache: PAYMENT_CACHE_NO_STORE,
  });

  if (!orderRes.ok) {
    createStructuredLog('ERROR', traceId, 'Payment gateway order registration failed', { status: orderRes.status });
    throw new Error('Gateway Order Failure');
  }

  const { id: paymobOrderId } = await orderRes.json() as { id: number };

  const paymentKeyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
    method: 'POST',
    headers: jsonHeaders,
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
    cache: PAYMENT_CACHE_NO_STORE,
  });

  if (!paymentKeyRes.ok) {
    createStructuredLog('ERROR', traceId, 'Payment gateway key generation failed', { status: paymentKeyRes.status });
    throw new Error('Gateway Payment Key Failure');
  }

  const { token: paymentToken } = await paymentKeyRes.json() as { token: string };

  return `https://accept.paymob.com/api/acceptance/iframes/${envServer.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
};

export async function POST(req: Request) {
  const traceId = randomUUID();

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      createStructuredLog('WARN', traceId, 'Rejected request: Unsupported Media Type', { contentType });
      return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
    }

    const rawBody: unknown = await req.json().catch(() => null);

    if (!isValidCheckoutPayload(rawBody)) {
      createStructuredLog('WARN', traceId, 'Rejected request: Payload validation failed');
      return NextResponse.json({ error: 'Unprocessable Entity' }, { status: 422 });
    }

    const payload = rawBody;
    const customerName = sanitizeInput(payload.customer_name, 100);
    const customerPhone = sanitizeInput(payload.customer_phone, 20);
    const customerAddress = sanitizeInput(payload.customer_address, 500);

    const pricingData = await fetchVerifiedPricing(payload.items, traceId);
    if (!pricingData) {
      return NextResponse.json({ error: 'Data integrity violation or product unavailability' }, { status: 409 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: insertedOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert([{
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        items: pricingData.secureItems,
        total_price: pricingData.secureTotalPrice,
        status: 'pending',
        payment_method: payload.payment_method,
      }])
      .select('id')
      .single();

    if (insertError || !insertedOrder?.id) {
      createStructuredLog('ERROR', traceId, 'Database insertion failure', { insertError });
      return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
    }

    if (payload.payment_method === 'cod') {
      createStructuredLog('INFO', traceId, 'COD order provisioned successfully', { orderId: insertedOrder.id });
      return NextResponse.json({ success: true, orderId: insertedOrder.id }, { status: 201 });
    }

    const nameParts = customerName.split(' ').filter(Boolean);
    const customerContext: CustomerContext = {
      firstName: nameParts[0] || 'Customer',
      lastName: nameParts.slice(1).join(' ') || 'Customer',
      phone: customerPhone,
      address: customerAddress || 'NA',
    };

    const paymentUrl = await handlePaymobOrchestration(
      insertedOrder.id,
      pricingData.secureTotalPrice,
      customerContext,
      pricingData.secureItems,
      traceId
    );

    createStructuredLog('INFO', traceId, 'Card order orchestrated successfully', { orderId: insertedOrder.id });
    return NextResponse.json({ success: true, orderId: insertedOrder.id, url: paymentUrl }, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown exception';
    createStructuredLog('ERROR', traceId, 'Unhandled execution failure', { errorMessage });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
