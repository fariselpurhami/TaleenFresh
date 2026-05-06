// src/components/admin/OrdersClient.tsx
'use client';

import { useState, useMemo } from 'react';
import { useAdminOrders } from '@/providers/AdminOrdersProvider'; // الـ Provider الجديد
import { useHaptics } from '@/hooks/useHaptics'; // إضافة محرك الاهتزاز
import { Phone, Clock, MapPin, ShoppingBag, User, Truck, Inbox, PackageCheck, ArchiveRestore } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusConfig = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'قيد الانتظار' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'جاري التجهيز' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'تم التوصيل' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'ملغي' },
};

const formatCivilianTime = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthName = months[date.getMonth()];

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;

  return `${day} ${monthName} | ${hours}:${minutes} ${ampm}`;
};

export default function OrdersClient() {
  // الاعتماد المعماري على المصدر المركزي (Single Source of Truth)
  const { orders, updateOrderStatus } = useAdminOrders();
  const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'archived'>('pending');
  
  // تهيئة الاهتزاز
  const { trigger } = useHaptics();

  const { filteredOrders, pendingCount, processingCount } = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending');
    const processing = orders.filter(o => o.status === 'processing');
    const archived = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

    let currentList = pending;
    if (activeTab === 'processing') currentList = processing;
    if (activeTab === 'archived') currentList = archived;

    return {
      filteredOrders: currentList,
      pendingCount: pending.length,
      processingCount: processing.length
    };
  }, [orders, activeTab]);

  return (
    <div className="w-full space-y-6 relative" dir="rtl">
      {/* 1. لوحة التحكم المرجعية (Segmented Control - Sticky & Glassy) */}
      <div className="sticky top-4 z-40 bg-gray-100/80 backdrop-blur-xl p-1.5 rounded-2xl flex gap-1.5 shadow-sm border border-white/50">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'pending' ? 'bg-white text-amber-600 shadow-[0_4px_12px_rgb(0,0,0,0.05)] scale-[1.02]' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
        >
          <Inbox className="w-4 h-4 hidden sm:block" />
          <span className="hidden sm:inline">جديد</span>
          <span className="sm:hidden">جديد</span>
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-700 py-0.5 px-2.5 rounded-full text-xs font-bold border border-amber-200/50">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('processing')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'processing' ? 'bg-white text-blue-600 shadow-[0_4px_12px_rgb(0,0,0,0.05)] scale-[1.02]' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
        >
          <PackageCheck className="w-4 h-4 hidden sm:block" />
          <span className="hidden sm:inline">جاري التجهيز</span>
          <span className="sm:hidden">تجهيز</span>
          {processingCount > 0 && (
            <span className="bg-blue-100 text-blue-700 py-0.5 px-2.5 rounded-full text-xs font-bold border border-blue-200/50">
              {processingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'archived' ? 'bg-white text-gray-900 shadow-[0_4px_12px_rgb(0,0,0,0.05)] scale-[1.02]' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
        >
          <ArchiveRestore className="w-4 h-4 hidden sm:block" />
          <span className="hidden sm:inline">سجل الطلبات</span>
          <span className="sm:hidden">سجل</span>
        </button>
      </div>

      {/* 2. عرض الكروت بشبكة ذكية (Smart Grid System) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
            <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-gray-500 font-bold text-lg">
              {activeTab === 'pending' ? 'لا توجد طلبات جديدة' : activeTab === 'processing' ? 'لا توجد طلبات قيد التجهيز' : 'سجل الطلبات فارغ'}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'pending' ? 'بانتظار طلبات العملاء القادمة...' : 'العمليات تسير بشكل ممتاز!'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const conf = statusConfig[order.status as keyof typeof statusConfig];

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border ${conf.border} shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md relative`}
              >
                <div className={`absolute top-0 right-0 bottom-0 w-1.5 ${conf.bg}`} />
                
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30 pl-5 pr-6">
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {formatCivilianTime(order.created_at)}
                  </div>
                  <div className="font-mono text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                    #{order.id.slice(0, 6)}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-full mt-0.5"><User className="w-4 h-4 text-gray-600" /></div>
                      <div><p className="text-xs text-gray-400 font-medium mb-0.5">العميل</p><p className="font-bold text-gray-900 text-sm">{order.customer_name}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-full mt-0.5"><Phone className="w-4 h-4 text-gray-600" /></div>
                      <div><p className="text-xs text-gray-400 font-medium mb-0.5">رقم الهاتف</p><p className="font-bold text-gray-900 text-sm font-mono tracking-wide" dir="ltr">{order.customer_phone}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-full mt-0.5"><MapPin className="w-4 h-4 text-gray-600" /></div>
                      <div><p className="text-xs text-gray-400 font-medium mb-0.5">العنوان بالتفصيل</p><p className="font-bold text-gray-900 text-sm leading-relaxed">{order.customer_address}</p></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="space-y-3">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="bg-white border border-gray-200 text-gray-600 font-bold w-6 h-6 flex items-center justify-center rounded-md text-xs shadow-sm">
                              {item.qty}
                            </span>
                            <span className="font-semibold text-gray-800">{item.name}</span>
                          </div>
                          <span className="font-bold text-gray-600 font-mono">{(item.price * item.qty).toFixed(0)} ج</span>
                        </div>
                      ))}
                      <div className="pt-3 mt-3 border-t border-gray-200 border-dashed flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-500">خدمة التوصيل</span>
                        </div>
                        <span className="font-bold text-gray-600 font-mono">25 ج</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- تم التحديث هنا فقط (الفوتر الخاص بالـ Select) --- */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between mt-auto">
                  <Select 
                    value={order.status} 
                    onValueChange={(val) => {
                      trigger('light'); // تشغيل الاهتزاز عند تغيير الحالة
                      updateOrderStatus(order.id, val);
                    }}
                  >
                    <SelectTrigger className={`w-[140px] h-10 text-sm font-bold border border-transparent shadow-sm transition-all duration-200 active:scale-95 ${conf.bg} ${conf.text}`}>
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    
                    <SelectContent dir="rtl" className="rounded-xl shadow-lg border-gray-100 animate-in fade-in-80 zoom-in-95">
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem 
                          key={key} 
                          value={key} 
                          className="text-right text-sm font-bold cursor-pointer py-3 transition-colors hover:bg-gray-50 focus:bg-gray-100"
                        >
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">الإجمالي شامل</p>
                    <p className="font-black text-xl text-green-700 font-mono">{order.total_price.toFixed(0)} ج.م</p>
                  </div>
                </div>
                {/* ----------------------------------------------------- */}
                
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
