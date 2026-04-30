// src/app/(admin)/admin/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OrdersClient from '@/components/admin/OrdersClient';
import { AdminProductCard } from '@/components/admin/AdminProductCard';
import { OrderRadar } from '@/components/admin/OrderRadar';

export const revalidate = 0; // تأكد من جلب البيانات الطازجة دائماً

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-xl border border-red-200">
        <h2 className="text-2xl font-bold mb-2">خطأ تكوين الخادم</h2>
        <p>المتغير SUPABASE_SERVICE_ROLE_KEY غير موجود في بيئة Vercel. يرجى إضافته وعمل Redeploy بدون كاش.</p>
      </div>
    );
  }

  // التهيئة المعمارية الصحيحة للـ Service Role في Next.js App Router
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
      // هذه الأسطر تمنع Supabase من محاولة التلاعب بالجلسات وتفعيل الـ God Mode بصمت
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    }
  );

  try {
    const { data: initialOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) throw new Error(`Orders Error: ${ordersError.message}`);

    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('name_en');

    if (productsError) throw new Error(`Products Error: ${productsError.message}`);

    return (
      <div className="space-y-8">
        <OrderRadar />
        <header className="bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">غرفة العمليات المركزية</h1>
        </header>
        
        <section>
          <h2 className="text-2xl font-bold mb-4">الطلبات الحية</h2>
          <OrdersClient initialOrders={initialOrders || []} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">إدارة المخزون</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products?.map((product) => (
              <AdminProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-xl border border-red-200">
        <h2 className="text-2xl font-bold mb-2">خطأ في قاعدة البيانات</h2>
        <p className="font-mono text-sm">{error.message}</p>
      </div>
    );
  }
}
