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
  type AdminOrder,
  type OrderStatus,
} from '@/providers/AdminOrdersProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TabType = 'pending' | 'processing' | 'archived';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

type StatusPresentation = {
  bg: string;
  text: string;
  border: string;
  label: string;
};

type TabDefinition = {
  id: TabType;
  label: string;
  shortLabel: string;
  icon: typeof Inbox;
  count: number;
  activeColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
};

const STATUS_CONFIG: Record<OrderStatus, StatusPresentation> = {
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
const PHONE_ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const STATUS_KEYS = Object.keys(STATUS_CONFIG) as OrderStatus[];

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
  numberingSystem: 'latn',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const currencyFormatter = new Intl.NumberFormat('en-US');

const formatDate = (dateString: string): string =>
  dateFormatter.format(new Date(dateString)).replace(',', ' |');

const normalizePhoneNumber = (value: string): string =>
  value.replace(/[٠-٩]/g, (digit) => String(PHONE_ARABIC_DIGITS.indexOf(digit)));

const formatMoney = (value: number): string => `${currencyFormatter.format(value)} ج`;

const getEmptyStateCopy = (tab: TabType): { title: string; description: string } => {
  if (tab === 'pending') {
    return {
      title: 'لا توجد طلبات جديدة',
      description: 'بانتظار طلبات العملاء القادمة...',
    };
  }

  if (tab === 'processing') {
    return {
      title: 'لا توجد طلبات قيد التجهيز',
      description: 'العمليات تسير بشكل ممتاز!',
    };
  }

  return {
    title: 'سجل الطلبات فارغ',
    description: 'لم يتم أرشفة أي طلبات بعد.',
  };
};

const getFilteredOrders = (orders: AdminOrder[], activeTab: TabType): AdminOrder[] => {
  if (activeTab === 'pending') {
    return orders.filter((order) => order.status === 'pending');
  }

  if (activeTab === 'processing') {
    return orders.filter((order) => order.status === 'processing');
  }

  return orders.filter(
    (order) => order.status === 'delivered' || order.status === 'cancelled'
  );
};

export default function OrdersClient() {
  const { orders, updateOrderStatus } = useAdminOrders();
  const { trigger } = useHaptics();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === 'pending').length,
    [orders]
  );

  const processingCount = useMemo(
    () => orders.filter((order) => order.status === 'processing').length,
    [orders]
  );

  const filteredOrders = useMemo(
    () => getFilteredOrders(orders, activeTab),
    [orders, activeTab]
  );

  const tabs = useMemo<TabDefinition[]>(
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

  const handleStatusChange = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      if (updatingOrderId === orderId) {
        return;
      }

      setUpdatingOrderId(orderId);

      try {
        trigger?.('light');
        await updateOrderStatus(orderId, nextStatus);
      } finally {
        setUpdatingOrderId((current) => (current === orderId ? null : current));
      }
    },
    [trigger, updateOrderStatus, updatingOrderId]
  );

  const emptyState = getEmptyStateCopy(activeTab);

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
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                isActive
                  ? `scale-[1.02] bg-white shadow-[0_4px_12px_rgb(0,0,0,0.05)] ${tab.activeColor}`
                  : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700 active:scale-[0.99]'
              }`}
            >
              <Icon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {tab.count > 0 && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${tab.badgeBg} ${tab.badgeBorder} ${tab.badgeText}`}
                  aria-label={`${tab.count} طلب`}
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
            <h3 className="text-lg font-bold text-gray-500">{emptyState.title}</h3>
            <p className="mt-1 text-sm text-gray-400">{emptyState.description}</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const status = STATUS_CONFIG[order.status];
            const isUpdating = updatingOrderId === order.id;

            return (
              <article
                key={order.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${status.border}`}
              >
                <div
                  className={`absolute bottom-0 right-0 top-0 w-1.5 ${status.bg}`}
                  aria-hidden="true"
                />

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
                          href={`tel:${normalizePhoneNumber(order.customer_phone)}`}
                          className="rounded font-mono text-sm font-bold tracking-wide text-gray-900 hover:text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          dir="ltr"
                        >
                          {normalizePhoneNumber(order.customer_phone)}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-gray-100 p-2">
                        <MapPin className="h-4 w-4 text-gray-600" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="mb-0.5 text-xs font-medium text-gray-400">
                          العنوان بالتفصيل
                        </p>
                        <p className="text-sm font-bold leading-relaxed text-gray-900">
                          {order.customer_address}
                        </p>
                      </div>
                    </div>
                  </address>

                  <section
                    aria-label={`محتويات الطلب ${order.id.slice(0, 6)}`}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div
                          key={`${order.id}-${item.name}-${index}`}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold text-gray-600 shadow-sm">
                              {item.qty}
                            </span>
                            <span className="truncate font-semibold text-gray-800">
                              {item.name}
                            </span>
                          </div>
                          <span className="shrink-0 font-mono font-bold text-gray-600">
                            {formatMoney(item.price * item.qty)}
                          </span>
                        </div>
                      ))}

                      <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          <span className="font-medium text-gray-500">خدمة التوصيل</span>
                        </div>
                        <span className="font-mono font-bold text-gray-600">
                          {formatMoney(DELIVERY_FEE)}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                <footer className="mt-auto flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/80 p-4">
                  <Select
                    value={order.status}
                    onValueChange={(value) => void handleStatusChange(order.id, value as OrderStatus)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger
                      aria-label="تحديث حالة الطلب"
                      className={`h-10 w-[140px] border border-transparent text-sm font-bold shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${status.bg} ${status.text}`}
                    >
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>

                    <SelectContent
                      dir="rtl"
                      className="animate-in fade-in-80 zoom-in-95 rounded-xl border-gray-100 shadow-lg"
                    >
                      {STATUS_KEYS.map((key) => (
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
                      {currencyFormatter.format(order.total_price)} ج.م
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
