//  src/components/admin/AnalyticsDashboard.tsx

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
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { TrendingUp, Package, Clock, DollarSign } from 'lucide-react';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  total_price: number;
  created_at: string;
  items: OrderItem[];
  status: string;
}

interface AnalyticsDashboardProps {
  orders: Order[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isRevenue = payload[0].name === 'revenue';
    return (
      <div className="rounded-2xl border border-white/20 bg-black/85 px-5 py-4 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl" dir="rtl">
        <p className="mb-1 text-sm font-medium text-gray-400">{label}</p>
        <p className="font-mono text-xl font-black text-[#4ADE80]">
          {payload[0].value} {isRevenue ? 'ج.م' : 'كجم'}
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
    const ordersByHour: Record<string, number> = {};

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('ar-EG', { weekday: 'short' });
    }).reverse();

    last7Days.forEach(day => { revenueByDay[day] = 0; });
    Array.from({ length: 24 }, (_, i) => { ordersByHour[`${i.toString().padStart(2, '0')}:00`] = 0; });

    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        totalRevenue += order.total_price;

        const date = new Date(order.created_at);
        const dayName = date.toLocaleDateString('ar-EG', { weekday: 'short' });
        if (revenueByDay[dayName] !== undefined) revenueByDay[dayName] += order.total_price;

        if (Array.isArray(order.items)) {
          order.items.forEach(item => {
            totalItemsSold += item.qty;
            productSales[item.name] = (productSales[item.name] || 0) + item.qty;
          });
        }
      }
    });

    const revenueChart = last7Days.map(day => ({ day, revenue: revenueByDay[day] }));
    const topProducts = Object.entries(productSales)
      .map(([name, qty]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { totalRevenue, totalItemsSold, revenueChart, topProducts };
  }, [orders]);

  const cards = [
    { title: 'إجمالي الإيرادات', value: `${analyticsData.totalRevenue.toLocaleString()} ج.م`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { title: 'إجمالي الطلبات', value: orders.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { title: 'الكميات المباعة', value: `${analyticsData.totalItemsSold} كجم`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { title: 'متوسط قيمة الطلب', value: `${orders.length > 0 ? Math.round(analyticsData.totalRevenue / orders.length) : 0} ج.م`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' }
  ];

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* 1. بطاقات المؤشرات الحيوية (KPI Cards) */}
      <div className="grid grid-cols-2 gap-4 landscape:grid-cols-4 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
            className={`flex items-center gap-4 rounded-3xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${card.border}`}
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${card.bg}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold text-gray-500 mb-1">{card.title}</p>
              <h3 className="font-mono text-xl font-black text-gray-900 tracking-tight">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 2. المخططات البيانية (Responsive Charts) */}
      <div className="grid grid-cols-1 gap-6 landscape:grid-cols-3 lg:grid-cols-3">
        {/* مخطط الإيرادات (Area Chart) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="col-span-1 flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2"
        >
          <h3 className="mb-6 text-lg font-black text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#2C643E]" />
            مؤشر الإيرادات (آخر 7 أيام)
          </h3>
          <div className="h-[250px] sm:h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.revenueChart} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2C643E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2C643E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace' }} width={50} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2C643E', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#2C643E" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2C643E' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* مخطط المنتجات الأكثر مبيعاً (Bar Chart المعالج) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="col-span-1 flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-black text-gray-800 flex items-center gap-2">
            <Package className="h-5 w-5 text-[#2C643E]" />
            المنتجات الأكثر مبيعاً
          </h3>
          <div className="h-[250px] sm:h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              {/* تم تحويل المخطط ليكون أفقياً (Horizontal) لحل مشكلة الأسماء الطويلة وتدوير الشاشة */}
              <BarChart data={analyticsData.topProducts} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 'bold' }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }} width={30} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="qty" name="qty" radius={[6, 6, 0, 0]} barSize={32}>
                  {analyticsData.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#2C643E' : '#86efac'} className="transition-all duration-300 hover:opacity-80" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
