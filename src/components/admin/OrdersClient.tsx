// src/components/admin/OrdersClient.tsx

'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ArchiveRestore,
  Clock,
  Inbox,
  MapPin,
  PackageCheck,
  Phone,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import {
  useAdminOrders,
  type Order,
  type OrderItem,
  type OrderStatus,
} from '@/providers/AdminOrdersProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateOrderStatusAction } from '@/app/actions/admin-actions';

type TabType = 'pending' | 'processing' | 'archived';

type StatusConfig = {
  readonly bg: string;
  readonly text: string;
  readonly border: string;
  readonly label: string;
};

type TabConfig = {
  readonly id: TabType;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: typeof Inbox;
  readonly count: number;
  readonly activeColor: string;
  readonly badgeBg: string;
  readonly badgeBorder: string;
  readonly badgeText: string;
};

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    label: 'قيد الانتظار',
  },
  processing: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    label: 'جاري التجهيز',
  },
  delivered: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    label: 'تم التوصيل',
  },
  cancelled: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    label: 'ملغي',
  },
};

const DELIVERY_FEE = 25;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  numberingSystem: 'latn',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const numberFormatter = new Intl.NumberFormat('en-US');

const formatDate = (dateString: string): string => {
  return dateFormatter.format(new Date(dateString)).replace(',', ' |');
};

const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit).toString());
};

const formatMoney = (value: number): string => {
  return numberFormatter.format(value);
};

const getOrderItems = (items: readonly OrderItem[] | unknown): readonly OrderItem[] => {
  return Array.isArray(items) ? items : [];
};

const isOrderStatus = (value: string): value is OrderStatus => {
  return value in STATUS_CONFIG;
};

export default function OrdersClient() {
  const { orders, setOrders } = useAdminOrders();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const { trigger } = useHaptics();

  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      const previousOrders = orders;

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
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
    [orders, setOrders]
  );

  const { filteredOrders, pendingCount, processingCount } = useMemo(() => {
    const pending: Order[] = [];
    const processing: Order[] = [];
    const archived: Order[] = [];

    for (const order of orders) {
      if (order.status === 'pending') {
        pending.push(order);
        continue;
      }

      if (order.status === 'processing') {
        processing.push(order);
        continue;
      }

      if (order.status === 'delivered' || order.status === 'cancelled') {
        archived.push(order);
      }
    }

    return {
      filteredOrders:
        activeTab === 'pending'
          ? pending
          : activeTab === 'processing'
          ? processing
          : archived,
      pendingCount: pending.length,
      processingCount: processing.length,
    };
  }, [activeTab, orders]);

  const tabs = useMemo<readonly TabConfig[]>(
    () => [
      {
        id: 'pending',
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
        id: 'processing',
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
        id: 'archived',
        label: 'سجل الطلبات',
        shortLabel: 'سجل',
        icon: ArchiveRestore,
        count: 0,
        activeColor: 'text-gray-900',
        badgeBg: '',
        badgeBorder: '',
        badgeText: '',
      },
    ],
    [pendingCount, processingCount]
  );

  return (
    <section className="relative w-full space-y-6" dir="rtl" aria-label="إدارة الطلبات">
      <nav
        role="tablist"
        aria-label="حالات الطلبات"
        className="sticky top-4 z-40 flex gap-1.5 rounded-2xl border border-white/50 bg-gray-100/80 p-1.5 shadow-sm backdrop-blur-xl"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
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
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {filteredOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-24 text-center">
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
            const safeStatus = isOrderStatus(order.status) ? order.status : 'pending';
            const statusConfig = STATUS_CONFIG[safeStatus];
            const items = getOrderItems(order.items);

            return (
              <article
                key={order.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border ${statusConfig.border} bg-white shadow-sm transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2`}
              >
                <div
                  className={`absolute bottom-0 right-0 top-0 w-1.5 ${statusConfig.bg}`}
                  aria-hidden="true"
                />

                <header className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 p-4 pl-5 pr-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    <time dateTime={order.created_at}>{formatDate(order.created_at)}</time>
                  </div>
                  <div
                    className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-bold text-gray-500"
                    aria-label={`معرف الطلب ${order.id.slice(0, 8)}`}
                  >
                    #{order.id.slice(0, 8)}
                  </div>
                </header>

                <div className="space-y-5 p-5">
                  <address className="flex flex-col gap-4 not-italic">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 rounded-full bg-gray-100 p-2">
                        <User className="h-4 w-4 text-gray-600" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-0.5 text-xs font-medium text-gray-400">العميل</p>
                        <p className="truncate text-sm font-bold text-gray-900" title={order.customer_name}>
                          {order.customer_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 rounded-full bg-gray-100 p-2">
                        <Phone className="h-4 w-4 text-gray-600" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="mb-0.5 text-xs font-medium text-gray-400">رقم الهاتف</p>
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="rounded font-mono text-sm font-bold tracking-wide text-gray-900 hover:text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          dir="ltr"
                        >
                          {normalizePhoneNumber(order.customer_phone)}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 rounded-full bg-gray-100 p-2">
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
                    <ul className="space-y-3">
                      {items.map((item, index) => (
                        <li key={`${order.id}-item-${index}`} className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold text-gray-600 shadow-sm">
                              {item.qty}
                            </span>
                            <span className="truncate font-semibold text-gray-800" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                          <span className="shrink-0 font-mono font-bold text-gray-600">
                            {formatMoney(item.price * item.qty)} ج
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        <span className="font-medium text-gray-500">خدمة التوصيل</span>
                      </div>
                      <span className="font-mono font-bold text-gray-600">
                        {formatMoney(DELIVERY_FEE)} ج
                      </span>
                    </div>
                  </div>
                </div>

                <footer className="mt-auto flex items-center justify-between border-t border-gray-100 bg-gray-50/80 p-4">
                  <Select
                    value={safeStatus}
                    onValueChange={(value) => {
                      if (!isOrderStatus(value)) {
                        return;
                      }
                      trigger?.('light');
                      void updateOrderStatus(order.id, value);
                    }}
                  >
                    <SelectTrigger
                      aria-label="تحديث حالة الطلب"
                      className={`h-10 w-[140px] border border-transparent text-sm font-bold shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 ${statusConfig.bg} ${statusConfig.text}`}
                    >
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>

                    <SelectContent
                      dir="rtl"
                      className="animate-in fade-in-80 zoom-in-95 rounded-xl border-gray-100 shadow-lg"
                    >
                      {(Object.entries(STATUS_CONFIG) as [OrderStatus, StatusConfig][]).map(
                        ([status, config]) => (
                          <SelectItem
                            key={status}
                            value={status}
                            className="cursor-pointer py-3 text-right text-sm font-bold transition-colors hover:bg-gray-50 focus:bg-gray-100 focus:text-blue-700"
                          >
                            {config.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  <div className="text-left">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      الإجمالي شامل
                    </p>
                    <p className="font-mono text-xl font-black text-green-700">
                      {formatMoney(order.total_price)} ج.م
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
