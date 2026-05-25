// src/app/(admin)/admin/page.tsx

'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Package, ShoppingCart, type LucideIcon } from 'lucide-react';
import OrdersClient from '@/components/admin/OrdersClient';
import { AdminProductCard } from '@/components/admin/AdminProductCard';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { fetchAdminDashboardData } from '@/app/actions/admin-actions';
import { useAdminOrders, type Order } from '@/providers/AdminOrdersProvider';

type TabType = 'orders' | 'inventory' | 'analytics';

type DashboardTab = {
  readonly id: TabType;
  readonly label: string;
  readonly icon: LucideIcon;
};

export type Product = NonNullable<ComponentProps<typeof AdminProductCard>['product']> & {
  id: string;
};

const TABS: readonly DashboardTab[] = [
  { id: 'orders', label: 'الطلبات الحية', icon: ShoppingCart },
  { id: 'inventory', label: 'إدارة المخزون', icon: Package },
  { id: 'analytics', label: 'التحليلات الذكية', icon: BarChart3 },
] as const;

const PANEL_TRANSITION = { duration: 0.2, ease: 'easeOut' } as const;

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { orders, setOrders } = useAdminOrders();

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const result = await fetchAdminDashboardData();

        if (cancelled) {
          return;
        }

        if (!result?.success) {
          setErrorMsg('فشل تحميل البيانات. تأكد من إعدادات النظام والصلاحيات.');
          return;
        }

        setProducts(Array.isArray(result.products) ? (result.products as Product[]) : []);
        setOrders(Array.isArray(result.orders) ? (result.orders as Order[]) : []);
      } catch {
        if (!cancelled) {
          setErrorMsg('حدث خطأ غير متوقع أثناء تحميل البيانات.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [setOrders]);

  const activePanel = useMemo(() => {
    if (activeTab === 'orders') {
      return (
        <motion.section
          key="orders"
          id="panel-orders"
          role="tabpanel"
          aria-labelledby="tab-orders"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={PANEL_TRANSITION}
          className="w-full"
        >
          <OrdersClient />
        </motion.section>
      );
    }

    if (activeTab === 'inventory') {
      return (
        <motion.section
          key="inventory"
          id="panel-inventory"
          role="tabpanel"
          aria-labelledby="tab-inventory"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={PANEL_TRANSITION}
          className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {products.map((product) => (
            <AdminProductCard key={product.id} product={product} />
          ))}
        </motion.section>
      );
    }

    return (
      <motion.section
        key="analytics"
        id="panel-analytics"
        role="tabpanel"
        aria-labelledby="tab-analytics"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={PANEL_TRANSITION}
        className="w-full"
      >
        <AnalyticsDashboard orders={orders} />
      </motion.section>
    );
  }, [activeTab, orders, products]);

  if (loading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center px-4 text-center text-sm font-black text-gray-500"
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
        className="flex min-h-dvh items-center justify-center px-4 text-center text-sm font-black text-red-600"
        dir="rtl"
        role="alert"
      >
        {errorMsg}
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8"
      dir="rtl"
    >
      <header className="sticky top-0 z-50 flex w-full flex-col gap-4 border-b border-gray-200/70 bg-gray-50/95 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <h1 className="px-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            غرفة العمليات
          </h1>
        </div>

        <div
          role="tablist"
          aria-label="أقسام لوحة التحكم"
          className="hide-scrollbar flex w-full gap-1 overflow-x-auto rounded-2xl border border-gray-200/70 bg-gray-100/80 p-1.5"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const activeClass =
              tab.id === 'analytics'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'bg-white text-[#2C643E] shadow-sm';

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-11 min-w-[132px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 ${
                  isActive ? activeClass : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="w-full flex-1 py-4">
        <AnimatePresence mode="wait" initial={false}>
          {activePanel}
        </AnimatePresence>
      </main>
    </div>
  );
}
