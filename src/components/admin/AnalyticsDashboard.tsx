'use client';

import { useMemo, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { Order, OrderItem, OrderStatus } from '@/providers/AdminOrdersProvider';

export interface AnalyticsDashboardProps {
  readonly orders: readonly Order[];
}

type RevenueChartPoint = {
  readonly dayKey: string;
  readonly dayLabel: string;
  readonly revenue: number;
};

type TopProduct = {
  readonly name: string;
  readonly qty: number;
};

type AnalyticsSummary = {
  readonly totalRevenue: number;
  readonly totalOrders: number;
  readonly fulfilledOrders: number;
  readonly totalItemsSold: number;
  readonly averageOrderValue: number;
  readonly revenueChart: readonly RevenueChartPoint[];
  readonly topProducts: readonly TopProduct[];
};

type MetricCard = {
  readonly id: string;
  readonly title: string;
  readonly value: string;
  readonly icon: LucideIcon;
  readonly iconClassName: string;
  readonly iconSurfaceClassName: string;
  readonly borderClassName: string;
};

type TooltipPayloadEntry = {
  readonly value?: ValueType;
  readonly name?: NameType;
  readonly dataKey?: string | number;
  readonly payload?: RevenueChartPoint;
};

type ChartTooltipContentProps = {
  readonly active?: boolean;
  readonly payload?: readonly TooltipPayloadEntry[];
  readonly label?: string | number;
};

const CANCELLED_STATUS: OrderStatus = 'cancelled';
const INCLUDED_ORDER_STATUSES: readonly OrderStatus[] = ['pending', 'processing', 'delivered'];
const CHART_STROKE = '#2C643E';
const CHART_FILL_ID = 'analytics-revenue-gradient';
const EMPTY_PRODUCT_STATE = 'لا توجد بيانات مبيعات حتى الآن';

const currencyFormatter = new Intl.NumberFormat('en-US');
const weekdayFormatter = new Intl.DateTimeFormat('ar-EG', { weekday: 'short' });

const getSafeOrderItems = (items: Order['items']): readonly OrderItem[] => {
  return Array.isArray(items) ? items : [];
};

const isIncludedStatus = (status: Order['status']): status is OrderStatus => {
  return INCLUDED_ORDER_STATUSES.includes(status as OrderStatus);
};

const formatCurrency = (value: number): string => `${currencyFormatter.format(value)} ج.م`;

const formatQuantity = (value: number): string => `${currencyFormatter.format(value)} كجم`;

function CustomTooltip({ active, payload, label }: ChartTooltipContentProps): ReactElement | null {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0];
  const rawValue = point?.value;
  const value = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
  const metricLabel = point?.dataKey === 'revenue' ? 'الإيراد' : 'القيمة';
  const safeLabel = typeof label === 'string' || typeof label === 'number' ? String(label) : '';

  return (
    <div
      className="rounded-2xl border border-white/15 bg-black/85 px-4 py-3 text-white shadow-2xl backdrop-blur-xl"
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <p className="text-xs font-bold text-gray-400">{safeLabel}</p>
      <p className="mt-1 text-sm font-medium text-gray-300">{metricLabel}</p>
      <p className="mt-1 font-mono text-lg font-black text-emerald-400">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export function AnalyticsDashboard({ orders }: AnalyticsDashboardProps) {
  const analyticsData = useMemo<AnalyticsSummary>(() => {
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dayKeys: string[] = [];
    const revenueMap = new Map<string, number>();

    for (let index = 6; index >= 0; index -= 1) {
      const currentDate = new Date(normalizedToday);
      currentDate.setDate(normalizedToday.getDate() - index);
      const dayKey = currentDate.toISOString().slice(0, 10);
      dayKeys.push(dayKey);
      revenueMap.set(dayKey, 0);
    }

    let totalRevenue = 0;
    let fulfilledOrders = 0;
    let totalItemsSold = 0;

    const productSales = new Map<string, number>();

    for (const order of orders) {
      if (order.status === CANCELLED_STATUS || !isIncludedStatus(order.status)) {
        continue;
      }

      totalRevenue += order.total_price;
      fulfilledOrders += 1;

      const orderDate = new Date(order.created_at);
      if (!Number.isNaN(orderDate.getTime())) {
        const orderDayKey = new Date(
          orderDate.getFullYear(),
          orderDate.getMonth(),
          orderDate.getDate()
        )
          .toISOString()
          .slice(0, 10);

        if (revenueMap.has(orderDayKey)) {
          revenueMap.set(orderDayKey, (revenueMap.get(orderDayKey) ?? 0) + order.total_price);
        }
      }

      for (const item of getSafeOrderItems(order.items)) {
        totalItemsSold += item.qty;
        productSales.set(item.name, (productSales.get(item.name) ?? 0) + item.qty);
      }
    }

    const revenueChart = dayKeys.map((dayKey) => {
      const parsedDate = new Date(`${dayKey}T00:00:00`);
      return {
        dayKey,
        dayLabel: weekdayFormatter.format(parsedDate),
        revenue: revenueMap.get(dayKey) ?? 0,
      };
    });

    const topProducts = Array.from(productSales.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((left, right) => right.qty - left.qty || left.name.localeCompare(right.name, 'ar'))
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders: orders.length,
      fulfilledOrders,
      totalItemsSold,
      averageOrderValue: fulfilledOrders > 0 ? Math.round(totalRevenue / fulfilledOrders) : 0,
      revenueChart,
      topProducts,
    };
  }, [orders]);

  const maxTopProductQty = useMemo(() => {
    return analyticsData.topProducts.reduce((max, product) => Math.max(max, product.qty), 0);
  }, [analyticsData.topProducts]);

  const metricCards = useMemo<readonly MetricCard[]>(
    () => [
      {
        id: 'revenue',
        title: 'إجمالي الإيرادات',
        value: formatCurrency(analyticsData.totalRevenue),
        icon: DollarSign,
        iconClassName: 'text-emerald-700',
        iconSurfaceClassName: 'bg-emerald-50',
        borderClassName: 'border-emerald-100',
      },
      {
        id: 'orders',
        title: 'إجمالي الطلبات',
        value: currencyFormatter.format(analyticsData.totalOrders),
        icon: ShoppingCart,
        iconClassName: 'text-blue-700',
        iconSurfaceClassName: 'bg-blue-50',
        borderClassName: 'border-blue-100',
      },
      {
        id: 'items',
        title: 'الكميات المباعة',
        value: formatQuantity(analyticsData.totalItemsSold),
        icon: TrendingUp,
        iconClassName: 'text-amber-700',
        iconSurfaceClassName: 'bg-amber-50',
        borderClassName: 'border-amber-100',
      },
      {
        id: 'aov',
        title: 'متوسط قيمة الطلب',
        value: formatCurrency(analyticsData.averageOrderValue),
        icon: Package,
        iconClassName: 'text-violet-700',
        iconSurfaceClassName: 'bg-violet-50',
        borderClassName: 'border-violet-100',
      },
    ],
    [
      analyticsData.averageOrderValue,
      analyticsData.totalItemsSold,
      analyticsData.totalOrders,
      analyticsData.totalRevenue,
    ]
  );

  return (
    <section className="w-full space-y-6" dir="rtl" aria-label="لوحة التحليلات">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.24, ease: 'easeOut' }}
              className={`flex min-h-[116px] items-center gap-4 rounded-3xl border bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md ${card.borderClassName}`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.iconSurfaceClassName}`}
              >
                <Icon className={`h-5 w-5 ${card.iconClassName}`} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <h2 className="text-xs font-bold text-gray-500 sm:text-sm">{card.title}</h2>
                <p className="mt-1 font-mono text-lg font-black tracking-tight text-gray-900 sm:text-2xl">
                  {card.value}
                </p>
              </div>
            </motion.article>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.24, ease: 'easeOut' }}
          className="flex h-[340px] flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:h-[400px] sm:p-6 xl:col-span-8"
          aria-labelledby="analytics-revenue-title"
        >
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3
                id="analytics-revenue-title"
                className="flex items-center gap-2 text-base font-black text-gray-900 sm:text-lg"
              >
                <TrendingUp className="h-5 w-5 text-[#2C643E]" aria-hidden="true" />
                مؤشر الإيرادات خلال آخر 7 أيام
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                يعتمد على جميع الطلبات غير الملغاة ضمن النافذة الزمنية الحالية
              </p>
            </div>
          </header>

          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analyticsData.revenueChart}
                accessibilityLayer
                margin={{ top: 12, right: 8, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={CHART_FILL_ID} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_STROKE} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={CHART_STROKE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="dayLabel"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={12}
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={64}
                  tickMargin={12}
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}
                  tickFormatter={(value: number) => currencyFormatter.format(value)}
                />
                <Tooltip
                  cursor={{ stroke: CHART_STROKE, strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={<CustomTooltip />}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke={CHART_STROKE}
                  strokeWidth={3}
                  fill={`url(#${CHART_FILL_ID})`}
                  activeDot={{ r: 5, fill: CHART_STROKE, stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.24, ease: 'easeOut' }}
          className="flex h-[340px] flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:h-[400px] sm:p-6 xl:col-span-4"
          aria-labelledby="analytics-top-products-title"
        >
          <header className="mb-4">
            <h3
              id="analytics-top-products-title"
              className="flex items-center gap-2 text-base font-black text-gray-900 sm:text-lg"
            >
              <Package className="h-5 w-5 text-[#2C643E]" aria-hidden="true" />
              المنتجات الأكثر مبيعاً
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              أعلى العناصر حسب الكمية المباعة
            </p>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            {analyticsData.topProducts.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-sm font-medium text-gray-400">
                {EMPTY_PRODUCT_STATE}
              </div>
            ) : (
              analyticsData.topProducts.map((product, index) => {
                const widthPercentage =
                  maxTopProductQty > 0 ? `${(product.qty / maxTopProductQty) * 100}%` : '0%';
                const isTopRank = index === 0;

                return (
                  <div key={product.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-bold text-gray-900" title={product.name}>
                        {product.name}
                      </span>
                      <span className="shrink-0 whitespace-nowrap font-mono text-xs font-bold text-gray-500">
                        {formatQuantity(product.qty)}
                      </span>
                    </div>

                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
                      aria-hidden="true"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: widthPercentage }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.7, delay: index * 0.06, ease: 'easeOut' }}
                        className={`h-full rounded-full ${isTopRank ? 'bg-[#2C643E]' : 'bg-emerald-300'}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>
      </div>
    </section>
  );
}
