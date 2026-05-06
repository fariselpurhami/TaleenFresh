// src/components/admin/OrdersClient.tsx

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/lib/supabase/client';
import { Phone, Clock, MapPin, ShoppingBag, User, Truck, Inbox, PackageCheck, ArchiveRestore } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { updateOrderStatusAction } from '@/app/actions/admin-actions';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total_price: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  created_at: string;
}


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

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'archived'>('pending');
  const { trigger } = useHaptics();

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {

    setOrders((current) =>
     current.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))

    );
    const result = await updateOrderStatusAction(orderId, newStatus);
    if (!result.success) {
     console.error('Failed to update status:', result.error);
   
    }
  };

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
    <div className="relative w-full space-y-6" dir="rtl">
      <div className="sticky top-4 z-40 flex gap-1.5 rounded-2xl border border-white/50 bg-gray-100/80 p-1.5 shadow-sm backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all duration-300 ${activeTab === 'pending' ? 'scale-[1.02] bg-white text-amber-600 shadow-[0_4px_12px_rgb(0,0,0,0.05)]' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
        >
          <Inbox className="hidden h-4 w-4 sm:block" />
          <span className="hidden sm:inline">جديد</span>
          <span className="sm:hidden">جديد</span>
          {pendingCount > 0 && (
            <span className="rounded-full border border-amber-200/50 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('processing')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all duration-300 ${activeTab === 'processing' ? 'scale-[1.02] bg-white text-blue-600 shadow-[0_4px_12px_rgb(0,0,0,0.05)]' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
        >
          <PackageCheck className="hidden h-4 w-4 sm:block" />
          <span className="hidden sm:inline">جاري التجهيز</span>
          <span className="sm:hidden">تجهيز</span>
          {processingCount > 0 && (
            <span className="rounded-full border border-blue-200/50 bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {processingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all duration-300 ${activeTab === 'archived' ? 'scale-[1.02] bg-white text-gray-900 shadow-[0_4px_12px_rgb(0,0,0,0.05)]' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
        >
          <ArchiveRestore className="hidden h-4 w-4 sm:block" />
          <span className="hidden sm:inline">سجل الطلبات</span>
          <span className="sm:hidden">سجل</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 py-20 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-500">
              {activeTab === 'pending' ? 'لا توجد طلبات جديدة' : activeTab === 'processing' ? 'لا توجد طلبات قيد التجهيز' : 'سجل الطلبات فارغ'}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {activeTab === 'pending' ? 'بانتظار طلبات العملاء القادمة...' : 'العمليات تسير بشكل ممتاز!'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const conf = statusConfig[order.status];

            return (
              <div
                key={order.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border ${conf.border} bg-white shadow-sm transition-all hover:shadow-md`}
              >
                <div className={`absolute bottom-0 right-0 top-0 w-1.5 ${conf.bg}`} />

                <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 p-4 pl-5 pr-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {formatCivilianTime(order.created_at)}
                  </div>
                  <div className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-bold text-gray-400">
                    #{order.id.slice(0, 6)}
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-gray-100 p-2"><User className="h-4 w-4 text-gray-600" /></div>
                      <div><p className="mb-0.5 text-xs font-medium text-gray-400">العميل</p><p className="text-sm font-bold text-gray-900">{order.customer_name}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-gray-100 p-2"><Phone className="h-4 w-4 text-gray-600" /></div>
                      <div><p className="mb-0.5 text-xs font-medium text-gray-400">رقم الهاتف</p><p className="font-mono text-sm font-bold tracking-wide text-gray-900" dir="ltr">{order.customer_phone}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-gray-100 p-2"><MapPin className="h-4 w-4 text-gray-600" /></div>
                      <div><p className="mb-0.5 text-xs font-medium text-gray-400">العنوان بالتفصيل</p><p className="text-sm font-bold leading-relaxed text-gray-900">{order.customer_address}</p></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm text-gray-600">
                              {item.qty}
                            </span>
                            <span className="font-semibold text-gray-800">{item.name}</span>
                          </div>
                          <span className="font-mono font-bold text-gray-600">{(item.price * item.qty).toFixed(0)} ج</span>
                        </div>
                      ))}
                      <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-500">خدمة التوصيل</span>
                        </div>
                        <span className="font-mono font-bold text-gray-600">25 ج</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 bg-gray-50/80 p-4">
                  <Select
                    value={order.status}
                    onValueChange={(val) => {
                      trigger('light');
                      updateOrderStatus(order.id, val);
                    }}
                  >
                    <SelectTrigger className={`h-10 w-[140px] border border-transparent text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 ${conf.bg} ${conf.text}`}>
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>

                    <SelectContent dir="rtl" className="animate-in fade-in-80 zoom-in-95 rounded-xl border-gray-100 shadow-lg">
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem
                          key={key}
                          value={key}
                          className="cursor-pointer py-3 text-right text-sm font-bold transition-colors hover:bg-gray-50 focus:bg-gray-100"
                        >
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="text-left">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">الإجمالي شامل</p>
                    <p className="font-mono text-xl font-black text-green-700">{order.total_price.toFixed(0)} ج.م</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
