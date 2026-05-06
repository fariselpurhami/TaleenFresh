// src/app/admin/layout.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AdminOrdersProvider } from '@/providers/AdminOrdersProvider';
import { OrderRadar } from '@/components/admin/OrderRadar';

export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
 const cookieStore = await cookies();
 
 const supabase = createServerClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
   {
     cookies: {
       getAll() { return cookieStore.getAll(); },
     },
   }
 );

 const { data: initialOrders } = await supabase
   .from('orders')
   .select('*')
   .order('created_at', { ascending: false })
   .limit(100);

 return (
   <AdminOrdersProvider initialOrders={initialOrders || []}>
     <OrderRadar />
     {/* التأكد من إضافة dir="rtl" هنا لدعم الواجهة العربية من الأساس */}
     <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
       {children}
     </div>
   </AdminOrdersProvider>
 );
}
