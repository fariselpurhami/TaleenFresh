// src/app/(admin)/admin/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client'; // لا يزال مطلوباً فقط للـ Realtime
import OrdersClient from '@/components/admin/OrdersClient';
import { AdminProductCard } from '@/components/admin/AdminProductCard';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShoppingCart, BarChart3 } from 'lucide-react';
// استيراد الأسلحة الجديدة
import { fetchAdminDashboardData } from '@/app/actions/admin-actions';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'analytics'>('orders');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      // استخدام الـ Server Action الآمن لجلب البيانات
      const result = await fetchAdminDashboardData();

      if (result.success) {
        setProducts(result.products!);
        setOrders(result.orders!);
      } else {
        setErrorMsg('فشل تحميل البيانات. تأكد من إعدادات الـ RLS والمفاتيح.');
      }
      setLoading(false);
    }

    loadData();

    // الرادار الحي (Real-time) لا يزال يعمل بالـ ANON_KEY لأنه يراقب الأحداث فقط
    // ولن يكسر الـ RLS إذا كان الـ Channel مسموحاً به (أو يمكنك تعطيله واستخدام Polling لو واجهت مشاكل)
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) => prev.map(o => o.id === payload.new.id ? payload.new : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center font-black text-gray-400" dir="rtl">جاري تحميل غرفة العمليات...</div>;
  if (errorMsg) return <div className="flex h-screen items-center justify-center font-black text-red-500" dir="rtl">{errorMsg}</div>;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-[calc(1rem+env(safe-area-inset-left))] pb-[calc(5rem+env(safe-area-inset-bottom))]" dir="rtl">
      <header className="sticky top-0 z-50 flex w-full flex-col gap-4 bg-gray-50 pb-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <h1 className="px-2 text-3xl font-black text-gray-900">غرفة العمليات</h1>

        <div className="flex w-full gap-1 rounded-2xl bg-gray-200/60 p-1.5 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition-all ${activeTab === 'orders' ? 'bg-white text-[#2C643E] shadow-sm' : 'text-gray-500 hover:bg-gray-300/50'}`}
          >
            <ShoppingCart size={20} />
            الطلبات الحية
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition-all ${activeTab === 'inventory' ? 'bg-white text-[#2C643E] shadow-sm' : 'text-gray-500 hover:bg-gray-300/50'}`}
          >
            <Package size={20} />
            إدارة المخزون
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition-all ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-300/50'}`}
          >
            <BarChart3 size={20} />
            التحليلات الذكية
          </button>
        </div>
      </header>

      <main className="w-full pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.section
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <OrdersClient initialOrders={orders} />
            </motion.section>
          )}

          {activeTab === 'inventory' && (
            <motion.section
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid w-full grid-cols-1 gap-4 md:grid-cols-2"
            >
              {products.map((product) => (
                <AdminProductCard key={product.id} product={product} />
              ))}
            </motion.section>
          )}

          {activeTab === 'analytics' && (
            <motion.section
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <AnalyticsDashboard orders={orders} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
