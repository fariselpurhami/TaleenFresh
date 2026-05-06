// src/app/actions/admin-actions.ts

'use server';


import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  }
);

export async function fetchAdminDashboardData() {
  try {
 
    const [productsRes, ordersRes] = await Promise.all([
      supabaseAdmin.from('products').select('*').order('name_en'),
      supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false })
    ]);

    if (productsRes.error) throw new Error(productsRes.error.message);
    if (ordersRes.error) throw new Error(ordersRes.error.message);

    return {
      success: true,
      products: productsRes.data || [],
      orders: ordersRes.data || []
    };
  } catch (error: any) {
    console.error('Admin Fetch Error:', error);
    return { success: false, error: error.message };
  }
}


export async function updateOrderStatusAction(orderId: string, newStatus: string) {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (error: any) {
    console.error('Update Status Error:', error);
    return { success: false, error: error.message };
  }
}
