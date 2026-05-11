// src/components/admin/AnalyticsDashboard.tsx

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Package, Clock, DollarSign } from 'lucide-react';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  total_price: number;
  created_at: string;
  items: OrderItem[];
  status: string;
}

export interface AnalyticsDashboardProps {
  orders: Order[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: Record<string, unknown>;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length > 0) {
    const dataPayload = payload[0];
    const isRevenue = dataPayload.name === 'revenue';
    const value = dataPayload.value ?? 0;

    return (
      <div
        className="rounded-2xl border border-white/20 bg-black/85 px-5 py-4 text-white shadow-xl backdrop-blur-xl"
        dir="rtl"
        role="tooltip"
      >
        <p className="mb-1 text-sm font-medium text-gray-400">{label}</p>
        <p className="font-mono text-xl font-black text-[#4ADE80]">
          {value.toLocaleString('en-US')} {isRevenue ? 'ج.م' : 'كجم'}
        </p>
      </div>
    );
  }
  return null;
};

export function AnalyticsDashboard({ orders }: AnalyticsDashboardProps) {
  const analyticsData = useMemo(() => {
    let totalRevenue = 0;
    let totalItemsSold = 0;
    const revenueByDay: Record<string, number> = {};
    const productSales: Record<string, number> = {};

    const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return formatter.format(d);
    }).reverse();

    last7Days.forEach((day) => {
      revenueByDay[day] = 0;
    });

    orders.forEach((order) => {
      if (order.status !== 'cancelled') {
        totalRevenue += order.total_price;

        const date = new Date(order.created_at);
        const dayName = formatter.format(date);

        if (revenueByDay[dayName] !== undefined) {
          revenueByDay[dayName] += order.total_price;
        }

        if (Array.isArray(order.items)) {
          order.items.forEach((item) => {
            totalItemsSold += item.qty;
            productSales[item.name] = (productSales[item.name] || 0) + item.qty;
          });
        }
      }
    });

    const revenueChart = last7Days.map((day) => ({
      day,
      revenue: revenueByDay[day],
    }));

    const topProducts = Object.entries(productSales)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const averageOrderValue =
      orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

    return {
      totalRevenue,
      totalItemsSold,
      revenueChart,
      topProducts,
      averageOrderValue,
    };
  }, [orders]);

  const cards = [
    {
      id: 'revenue',
      title: 'إجمالي الإيرادات',
      value: `${analyticsData.totalRevenue.toLocaleString('en-US')} ج.م`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      id: 'orders',
      title: 'إجمالي الطلبات',
      value: orders.length.toLocaleString('en-US'),
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      id: 'items',
      title: 'الكميات المباعة',
      value: `${analyticsData.totalItemsSold.toLocaleString('en-US')} كجم`,
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      id: 'aov',
      title: 'متوسط قيمة الطلب',
      value: `${analyticsData.averageOrderValue.toLocaleString('en-US')} ج.م`,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
  ];

  return (
    <section className="w-full space-y-6" dir="rtl" aria-label="لوحة التحليلات">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
              className={`flex flex-col items-start gap-4 rounded-3xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center ${card.border}`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${card.bg}`}
              >
                <Icon
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-2 flex flex-col justify-center sm:mt-0">
                <h2 className="mb-1 text-[11px] font-bold text-gray-500 sm:text-xs">
                  {card.title}
                </h2>
                <p className="font-mono text-lg font-black tracking-tight text-gray-900 sm:text-xl">
                  {card.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex h-[320px] flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:h-[400px] sm:p-6 lg:col-span-2"
        >
          <h3 className="mb-4 flex shrink-0 items-center gap-2 text-lg font-black text-gray-800">
            <TrendingUp className="h-5 w-5 text-[#2C643E]" aria-hidden="true" />
            مؤشر الإيرادات (آخر 7 أيام)
          </h3>
          <div className="relative min-h-0 w-full flex-1">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                <AreaChart
                  data={analyticsData.revenueChart}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2C643E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2C643E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#9ca3af',
                      fontSize: 12,
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                    }}
                    width={60}
                    orientation="left"
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#2C643E', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="#2C643E"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#2C643E' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex h-[320px] flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:h-[400px] sm:p-6 lg:col-span-1"
        >
          <h3 className="mb-2 flex shrink-0 items-center gap-2 text-lg font-black text-gray-800">
            <Package className="h-5 w-5 text-[#2C643E]" aria-hidden="true" />
            المنتجات الأكثر مبيعاً
          </h3>

          <div className="custom-scrollbar mt-4 flex flex-1 flex-col justify-around gap-3 overflow-y-auto pr-1">
            {analyticsData.topProducts.map((product, index) => {
              const maxQty = Math.max(...analyticsData.topProducts.map((p) => p.qty), 1);
              const widthPercentage = `${(product.qty / maxQty) * 100}%`;

              return (
                <div key={product.name} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate pl-2 font-bold text-gray-800">
                      {product.name}
                    </span>
                    <span className="whitespace-nowrap font-mono text-xs font-bold text-gray-500">
                      {product.qty.toLocaleString('en-US')} كجم
                    </span>
                  </div>

                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
                    dir="rtl"
                    aria-hidden="true"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: widthPercentage }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-[#2C643E]' : 'bg-[#86efac]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            {analyticsData.topProducts.length === 0 && (
              <div className="flex h-full items-center justify-center text-sm font-medium text-gray-400">
                لا توجد بيانات مبيعات حتى الآن
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
