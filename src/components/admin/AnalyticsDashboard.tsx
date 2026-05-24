// src/components/admin/AnalyticsDashboard.tsx

'use client';

import { useMemo } from 'react';
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
import { Clock, DollarSign, Package, TrendingUp } from 'lucide-react';
import { type Order } from '@/providers/AdminOrdersProvider';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface AnalyticsDashboardProps {
  orders: Order[];
}

interface ChartPoint {
  day: string;
  revenue: number;
}

interface TopProduct {
  name: string;
  qty: number;
}

interface DashboardAnalytics {
  totalRevenue: number;
  totalItemsSold: number;
  revenueChart: ChartPoint[];
  topProducts: TopProduct[];
  averageOrderValue: number;
}

interface CardConfig {
  id: string;
  title: string;
  value: string;
  icon: typeof DollarSign;
  color: string;
  bg: string;
  border: string;
}

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const moneyFormatter = new Intl.NumberFormat('en-US');

const getNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const getString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const getItems = (value: unknown): OrderItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const record = item as Record<string, unknown>;
    const name = getString(record.name).trim();
    const qty = getNumber(record.qty);
    const price = getNumber(record.price);

    if (!name) {
      return [];
    }

    return [{ name, qty, price }];
  });
};

const getTotalPrice = (order: Order): number => getNumber(order.total_price);

const getCreatedAt = (order: Order): string => getString(order.created_at);

const isCancelled = (order: Order): boolean => getString(order.status) === 'cancelled';

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const dataPoint = payload[0];
  const metricName = getString(dataPoint.name);
  const value =
    typeof dataPoint.value === 'number'
      ? dataPoint.value
      : Number(dataPoint.value ?? 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl" dir="rtl">
      <p className="mb-1 text-sm font-bold text-gray-900">{label}</p>
      <p className="font-mono text-sm font-black text-emerald-700">
        {moneyFormatter.format(Number.isFinite(value) ? value : 0)}{' '}
        {metricName === 'revenue' ? 'ج.م' : 'كجم'}
      </p>
    </div>
  );
};

export function AnalyticsDashboard({ orders }: AnalyticsDashboardProps) {
  const analyticsData = useMemo<DashboardAnalytics>(() => {
    let totalRevenue = 0;
    let totalItemsSold = 0;
    const revenueByDay: Record<string, number> = {};
    const productSales: Record<string, number> = {};
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
      return weekdayFormatter.format(date);
    }).reverse();

    last7Days.forEach((day) => {
      revenueByDay[day] = 0;
    });

    orders.forEach((order) => {
      if (isCancelled(order)) {
        return;
      }

      const totalPrice = getTotalPrice(order);
      totalRevenue += totalPrice;

      const createdAt = getCreatedAt(order);
      if (createdAt) {
        const dayName = weekdayFormatter.format(new Date(createdAt));
        if (dayName in revenueByDay) {
          revenueByDay[dayName] += totalPrice;
        }
      }

      const items = getItems(order.items);
      items.forEach((item) => {
        totalItemsSold += item.qty;
        productSales[item.name] = (productSales[item.name] ?? 0) + item.qty;
      });
    });

    const revenueChart = last7Days.map((day) => ({
      day,
      revenue: revenueByDay[day] ?? 0,
    }));

    const topProducts = Object.entries(productSales)
      .map(([name, qty]) => ({ name, qty }))
      .sort((left, right) => right.qty - left.qty)
      .slice(0, 5);

    const completedOrdersCount = orders.filter((order) => !isCancelled(order)).length;
    const averageOrderValue =
      completedOrdersCount > 0 ? Math.round(totalRevenue / completedOrdersCount) : 0;

    return {
      totalRevenue,
      totalItemsSold,
      revenueChart,
      topProducts,
      averageOrderValue,
    };
  }, [orders]);

  const cards = useMemo<CardConfig[]>(
    () => [
      {
        id: 'revenue',
        title: 'إجمالي الإيرادات',
        value: `${moneyFormatter.format(analyticsData.totalRevenue)} ج.م`,
        icon: DollarSign,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
      },
      {
        id: 'orders',
        title: 'إجمالي الطلبات',
        value: moneyFormatter.format(orders.length),
        icon: Package,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
      },
      {
        id: 'items',
        title: 'الكميات المباعة',
        value: `${moneyFormatter.format(analyticsData.totalItemsSold)} كجم`,
        icon: TrendingUp,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
      },
      {
        id: 'aov',
        title: 'متوسط قيمة الطلب',
        value: `${moneyFormatter.format(analyticsData.averageOrderValue)} ج.م`,
        icon: Clock,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-100',
      },
    ],
    [analyticsData, orders.length]
  );

  const maxTopProductQty = useMemo(
    () => Math.max(...analyticsData.topProducts.map((product) => product.qty), 1),
    [analyticsData.topProducts]
  );

  return (
    <section className="space-y-6" dir="rtl" aria-label="لوحة تحليلات الطلبات">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={`rounded-3xl border bg-white p-5 shadow-sm ${card.border}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-500">{card.title}</p>
                  <p className="mt-2 font-mono text-2xl font-black text-gray-900">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-2xl p-3 ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} aria-hidden="true" />
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-gray-900">مؤشر الإيرادات</h3>
              <p className="text-sm font-medium text-gray-500">آخر 7 أيام</p>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.revenueChart} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="orders-revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(value: number) => moneyFormatter.format(value)}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2C643E', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#15803d"
                  strokeWidth={3}
                  fill="url(#orders-revenue-gradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5">
            <h3 className="text-lg font-black text-gray-900">المنتجات الأكثر مبيعاً</h3>
            <p className="text-sm font-medium text-gray-500">حسب إجمالي الكميات</p>
          </div>

          <div className="space-y-4">
            {analyticsData.topProducts.map((product) => {
              const widthPercentage = `${(product.qty / maxTopProductQty) * 100}%`;

              return (
                <div key={product.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-bold text-gray-800">{product.name}</span>
                    <span className="shrink-0 font-mono font-black text-gray-500">
                      {moneyFormatter.format(product.qty)} كجم
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: widthPercentage }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })}

            {analyticsData.topProducts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                <p className="text-sm font-bold text-gray-500">لا توجد بيانات مبيعات حتى الآن</p>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </section>
  );
}
