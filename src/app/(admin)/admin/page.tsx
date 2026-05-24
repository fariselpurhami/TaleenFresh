// src/app/(admin)/admin/page.tsx

'use client';

import { useState, useEffect, type ComponentProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShoppingCart, BarChart3 } from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import OrdersClient from '@/components/admin/OrdersClient';
import { AdminProductCard } from '@/components/admin/AdminProductCard';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { fetchAdminDashboardData } from '@/app/actions/admin-actions';

type TabType = 'orders' | 'inventory' | 'analytics';

export type Order = NonNullable<ComponentProps<typeof OrdersClient>['initialOrders']>[number] & {
  id: string;
};

export type Product = NonNullable<ComponentProps<typeof AdminProductCard>['product']> & {
  id: string;
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const result = await fetchAdminDashboardData();

        if (!isMounted) return;

        if (result.success) {
          setProducts((result.products as unknown as Product[]) || []);
          setOrders((result.orders as unknown as Order[]) || []);
        } else {
          setErrorMsg('فشل تحميل البيانات. تأكد من إعدادات الـ RLS والمفاتيح.');
        }
      } catch {
        if (isMounted) {
          setErrorMsg('حدث خطأ غير متوقع أثناء تحميل البيانات.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center font-black text-gray-400"
        dir="rtl"
        role="status"
        aria-live="polite"
      >
        جاري تحميل غرفة العمليات...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div
        className="flex h-screen items-center justify-center font-black text-red-500"
        dir="rtl"
        role="alert"
      >
        {errorMsg}
      </div>
    );
  }

  const tabs = [
    { id: 'orders', label: 'الطلبات الحية', icon: ShoppingCart },
    { id: 'inventory', label: 'إدارة المخزون', icon: Package },
    { id: 'analytics', label: 'التحليلات الذكية', icon: BarChart3 },
  ] as const;

  return (
    <div
      className="mx-auto flex w-full max-w-7xl flex-col px-[calc(1rem+env(safe-area-inset-left))] pb-[calc(5rem+env(safe-area-inset-bottom))]"
      dir="rtl"
    >
      <header className="sticky top-0 z-50 flex w-full flex-col gap-4 bg-gray-50 pb-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <h1 className="px-2 text-3xl font-black text-gray-900">
          غرفة العمليات
        </h1>

        <div
          role="tablist"
          aria-label="أقسام لوحة التحكم"
          className="hide-scrollbar flex w-full gap-1 overflow-x-auto rounded-2xl bg-gray-200/60 p-1.5"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 ${
                  isActive
                    ? tab.id === 'analytics'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'bg-white text-[#2C643E] shadow-sm'
                    : 'text-gray-500 hover:bg-gray-300/50'
                }`}
              >
                <Icon size={20} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="w-full pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.section
              key="orders"
              id="panel-orders"
              role="tabpanel"
              aria-labelledby="tab-orders"
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
              id="panel-inventory"
              role="tabpanel"
              aria-labelledby="tab-inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {products.map((product) => (
                <AdminProductCard key={product.id} product={product} />
              ))}
            </motion.section>
          )}

          {activeTab === 'analytics' && (
            <motion.section
              key="analytics"
              id="panel-analytics"
              role="tabpanel"
              aria-labelledby="tab-analytics"
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
