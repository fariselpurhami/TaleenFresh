// src/components/admin/OrdersClient.tsx

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import {
  Phone,
  Clock,
  MapPin,
  ShoppingBag,
  User,
  Truck,
  Inbox,
  PackageCheck,
  ArchiveRestore,
} from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { updateOrderStatusAction } from '@/app/actions/admin-actions';

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total_price: number;
  status: OrderStatus;
  created_at: string;
}

interface OrdersClientProps {
  initialOrders: Order[];
}

type TabType = 'pending' | 'processing' | 'archived';

const STATUS_CONFIG: Record<OrderStatus, { bg: string; text: string; border: string; label: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'قيد الانتظار' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'جاري التجهيز' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'تم التوصيل' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'ملغي' },
};

const DELIVERY_FEE = 25;

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    numberingSystem: 'latn',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return formatter.format(date).replace(',', ' |');
};

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const { trigger } = useHaptics();

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      const previousOrders = [...orders];

      setOrders((current) =>
        current.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      try {
        const result = await updateOrderStatusAction(orderId, newStatus);
        if (!result?.success) {
          setOrders(previousOrders);
        }
      } catch {
        setOrders(previousOrders);
      }
    },
    [orders]
  );

  const { filteredOrders, pendingCount, processingCount } = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending');
    const processing = orders.filter((o) => o.status === 'processing');
    const archived = orders.filter(
      (o) => o.status === 'delivered' || o.status === 'cancelled'
    );

    let currentList = pending;
    if (activeTab === 'processing') currentList = processing;
    if (activeTab === 'archived') currentList = archived;

    return {
      filteredOrders: currentList,
      pendingCount: pending.length,
      processingCount: processing.length,
    };
  }, [orders, activeTab]);

  const TABS = [
    {
      id: 'pending' as const,
      label: 'جديد',
      shortLabel: 'جديد',
      icon: Inbox,
      count: pendingCount,
      activeColor: 'text-amber-600',
      badgeBg: 'bg-amber-100',
      badgeBorder: 'border-amber-200/50',
      badgeText: 'text-amber-700',
    },
    {
      id: 'processing' as const,
      label: 'جاري التجهيز',
      shortLabel: 'تجهيز',
      icon: PackageCheck,
      count: processingCount,
      activeColor: 'text-blue-600',
      badgeBg: 'bg-blue-100',
      badgeBorder: 'border-blue-200/50',
      badgeText: 'text-blue-700',
    },
    {
      id: 'archived' as const,
      label: 'سجل الطلبات',
      shortLabel: 'سجل',
      icon: ArchiveRestore,
      count: 0,
      activeColor: 'text-gray-900',
      badgeBg: '',
      badgeBorder: '',
      badgeText: '',
    },
  ];

  return (
    <section className="relative w-full space-y-6" dir="rtl" aria-label="إدارة الطلبات">
      <nav
        role="tablist"
        aria-label="حالات الطلبات"
        className="sticky top-4 z-40 flex gap-1.5 rounded-2xl border border-white/50 bg-gray-100/80 p-1.5 shadow-sm backdrop-blur-xl"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                isActive
                  ? `scale-[1.02] bg-white shadow-[0_4px_12px_rgb(0,0,0,0.05)] ${tab.activeColor}`
                  : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              <Icon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {tab.count > 0 && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${tab.badgeBg} ${tab.badgeBorder} ${tab.badgeText}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {filteredOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 py-20 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" aria-hidden="true" />
            <h3 className="text-lg font-bold text-gray-500">
              {activeTab === 'pending'
                ? 'لا توجد طلبات جديدة'
                : activeTab === 'processing'
                ? 'لا توجد طلبات قيد التجهيز'
                : 'سجل الطلبات فارغ'}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {activeTab === 'pending'
                ? 'بانتظار طلبات العملاء القادمة...'
                : 'العمليات تسير بشكل ممتاز!'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const conf = STATUS_CONFIG[order.status];

            return (
              <article
                key={order.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border ${conf.border} bg-white shadow-sm transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2`}
              >
                <div className={`absolute bottom-0 right-0 top-0 w-1.5 ${conf.bg}`} aria-hidden="true" />

                <header className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 p-4 pl-5 pr-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    <time dateTime={order.created_at}>{formatDate(order.created_at)}</time>
                  </div>
                  <div
                    className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-bold text-gray-400"
                    aria-label={`معرف الطلب ${order.id.slice(0, 6)}`}
                  >
                    #{order.id.slice(0, 6)}
                  </div>
                </header>

                <div className="space-y-4 p-5">
                  <address className="flex flex-col gap-3 not-italic">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-gray-100 p-2">
                        <User className="h-4 w-4 text-gray-600" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="mb-0.5 text-xs font-medium text-gray-400">العميل</p>
                        <p className="text-sm font-bold text-gray-900">{order.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-gray-100 p-2">
                        <Phone className="h-4 w-4 text-gray-600" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="mb-0.5 text-xs font-medium text-gray-400">رقم الهاتف</p>
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="font-mono text-sm font-bold tracking-wide text-gray-900 hover:text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                          dir="ltr"
                        >
                          {order.customer_phone.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-gray-100 p-2">
                        <MapPin className="h-4 w-4 text-gray-600" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="mb-0.5 text-xs font-medium text-gray-400">العنوان بالتفصيل</p>
                        <p className="text-sm font-bold leading-relaxed text-gray-900">
                          {order.customer_address}
                        </p>
                      </div>
                    </div>
                  </address>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={`${order.id}-item-${idx}`} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold text-gray-600 shadow-sm">
                              {item.qty}
                            </span>
                            <span className="font-semibold text-gray-800">{item.name}</span>
                          </div>
                          <span className="font-mono font-bold text-gray-600">
                            {(item.price * item.qty).toLocaleString('en-US')} ج
                          </span>
                        </div>
                      ))}
                      <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          <span className="font-medium text-gray-500">خدمة التوصيل</span>
                        </div>
                        <span className="font-mono font-bold text-gray-600">
                          {DELIVERY_FEE.toLocaleString('en-US')} ج
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <footer className="mt-auto flex items-center justify-between border-t border-gray-100 bg-gray-50/80 p-4">
                  <Select
                    value={order.status}
                    onValueChange={(val: OrderStatus) => {
                      if (trigger) trigger('light');
                      updateOrderStatus(order.id, val);
                    }}
                  >
                    <SelectTrigger
                      aria-label="تحديث حالة الطلب"
                      className={`h-10 w-[140px] border border-transparent text-sm font-bold shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 ${conf.bg} ${conf.text}`}
                    >
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>

                    <SelectContent
                      dir="rtl"
                      className="animate-in fade-in-80 zoom-in-95 rounded-xl border-gray-100 shadow-lg"
                    >
                      {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((key) => (
                        <SelectItem
                          key={key}
                          value={key}
                          className="cursor-pointer py-3 text-right text-sm font-bold transition-colors hover:bg-gray-50 focus:bg-gray-100 focus:text-blue-700"
                        >
                          {STATUS_CONFIG[key].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="text-left">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      الإجمالي شامل
                    </p>
                    <p className="font-mono text-xl font-black text-green-700">
                      {order.total_price.toLocaleString('en-US')} ج.م
                    </p>
                  </div>
                </footer>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
