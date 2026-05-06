//  src/app/api/checkout/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'System configuration error' },
        { status: 500 }
      );
    }

    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    const { customer_name, customer_phone, customer_address, items, total_price, status } = body;

    if (!customer_name || !customer_phone || !customer_address) {
      return NextResponse.json(
        { error: 'Missing customer details' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart cannot be empty' },
        { status: 400 }
      );
    }

    if (typeof total_price !== 'number' || total_price <= 0) {
      return NextResponse.json(
        { error: 'Invalid total price' },
        { status: 400 }
      );
    }

    const orderData = {
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_address: customer_address.trim(),
      items: items.map(item => ({
        name: String(item.name).trim(),
        qty: Number(item.qty),
        price: Number(item.price)
      })),
      total_price: Number(total_price),
      status: status || 'pending'
    };

    const { error: dbError } = await supabase
      .from('orders')
      .insert([orderData]);

    if (dbError) {
      return NextResponse.json(
        { error: 'Database transaction failed' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Order created successfully' },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error processing checkout' },
      { status: 500 }
    );
  }
}
