// src/app/actions/admin-actions.ts

'use server';

import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('CRITICAL: Missing Supabase admin environment variables.');
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, options) => {
        return fetch(url, { ...options, cache: 'no-store' });
      },
    },
  }
);

interface Product {
  readonly id: string;
  readonly name_en: string;
  readonly name_ar?: string;
  readonly category: string;
  readonly price_per_kg: number;
  readonly is_available: boolean;
  readonly image_url?: string;
}

interface Order {
  readonly id: string;
  readonly created_at: string;
  readonly customer_name: string;
  readonly customer_phone: string;
  readonly customer_address: string;
  readonly status: string;
  readonly total_price: number;
  readonly payment_method: string;
}

export type FetchAdminDashboardResult =
  | { readonly success: true; readonly products: readonly Product[]; readonly orders: readonly Order[] }
  | { readonly success: false; readonly error: string };

export type ActionMutationResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: string };

type ValidOrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export async function fetchAdminDashboardData(): Promise<FetchAdminDashboardResult> {
  noStore();

  try {
    const [productsRes, ordersRes] = await Promise.all([
      supabaseAdmin.from('products').select('*').order('name_en'),
      supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
    ]);

    if (productsRes.error) {
      throw new Error(`Failed to fetch products: ${productsRes.error.message}`);
    }

    if (ordersRes.error) {
      throw new Error(`Failed to fetch orders: ${ordersRes.error.message}`);
    }

    return {
      success: true,
      products: (productsRes.data as Product[]) || [],
      orders: (ordersRes.data as Order[]) || [],
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error during dashboard fetch';
    console.error('[AdminActions] fetchAdminDashboardData Error:', msg);
    return { success: false, error: msg };
  }
}

export async function updateOrderStatusAction(orderId: string, newStatus: string): Promise<ActionMutationResult> {
  noStore();

  if (!orderId || typeof orderId !== 'string') {
    return { success: false, error: 'Invalid order ID provided.' };
  }

  const validStatuses: ValidOrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(newStatus as ValidOrderStatus)) {
    return { success: false, error: 'Invalid status transition requested.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Database error updating status: ${error.message}`);
    }

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error updating order status';
    console.error(`[AdminActions] updateOrderStatusAction Error (order: ${orderId}):`, msg);
    return { success: false, error: msg };
  }
}

export async function updateProductAction(
  productId: string,
  updates: Partial<Omit<Product, 'id'>>
): Promise<ActionMutationResult> {
  noStore();

  if (!productId || typeof productId !== 'string') {
    return { success: false, error: 'Invalid product ID provided.' };
  }

  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return { success: false, error: 'No valid updates provided for the product.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', productId);

    if (error) {
      throw new Error(`Database error updating product: ${error.message}`);
    }

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error updating product';
    console.error(`[AdminActions] updateProductAction Error (product: ${productId}):`, msg);
    return { success: false, error: msg };
  }
}
