// src/components/admin/OrdersClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// --- Type Definitions ---
interface CartItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: CartItem[];
  total_price: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  created_at: string;
}

// --- Status Dictionaries ---
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  processing: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  delivered: 'bg-green-100 text-green-800 hover:bg-green-200',
  cancelled: 'bg-red-100 text-red-800 hover:bg-red-200',
};

const statusLabels = {
  pending: 'قيد الانتظار',
  processing: 'جاري التجهيز',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

const formatCivilianTime = (dateString: string) => {
  const date = new Date(dateString);

  const day = date.getDate();
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';

  // تحويل نظام 24 إلى 12
  hours = hours % 12;
  hours = hours ? hours : 12; // لو الساعة 0 (نصف الليل) خليها 12

  return `${day} ${month} ${year} | ${hours}:${minutes} ${ampm}`;
};

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Audio Alert System
  const playAlert = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/notification.mp3');
      audio.play().catch((e) => console.log('Audio play blocked by browser:', e));
    }
  };

  // Real-time Supabase Subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((current) => [newOrder, ...current]);
          playAlert(); // Trigger Audio Alert
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrders((current) =>
            current.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update Status Function
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Optimistic UI Update for zero-latency feel
    setOrders((current) =>
      current.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
    );

    // Database Mutation
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update status:', error);
      // In a real app, you would rollback the state here if it fails
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="text-right font-bold text-gray-700">رقم الطلب</TableHead>
              <TableHead className="text-right font-bold text-gray-700">العميل</TableHead>
              <TableHead className="text-right font-bold text-gray-700">التاريخ</TableHead>
              <TableHead className="text-right font-bold text-gray-700">الإجمالي</TableHead>
              <TableHead className="text-right font-bold text-gray-700">الحالة</TableHead>
              <TableHead className="text-right font-bold text-gray-700">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  لا توجد طلبات حالياً.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* ID (Truncated for cleaner UI) */}
                  <TableCell className="font-mono text-sm text-gray-500">
                    #{order.id.split('-')[0]}
                  </TableCell>
                  
                  {/* Customer Info */}
                  <TableCell>
                    <div className="font-semibold text-gray-900">{order.customer_name}</div>
                    <div className="text-sm text-gray-500" dir="ltr">{order.customer_phone}</div>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-sm font-bold text-gray-600 whitespace-nowrap" dir="rtl">
                    {formatCivilianTime(order.created_at)}
                  </TableCell>

                  {/* Total Price */}
                  <TableCell className="text-sm text-gray-600">
                    {order.total_price.toFixed(2)} ج.م
                  </TableCell>

                  {/* Status Manager */}
                  <TableCell>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(val) => updateOrderStatus(order.id, val)}
                    >
                      <SelectTrigger className={`w-[140px] border-none font-semibold ${statusColors[order.status]}`}>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="font-medium">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Actions (Order Details Modal) */}
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="font-semibold text-gray-700 hover:text-black">
                          التفاصيل
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] rounded-2xl" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black text-gray-900 border-b border-gray-100 pb-4 text-right pl-12 mt-2">تفاصيل الطلب</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4 pt-4">
                          {/* Customer Address Card */}
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="font-semibold text-gray-500 mb-1 text-sm">العنوان</h4>
                            <p className="text-gray-900 font-medium">{order.customer_address}</p>
                          </div>

                          {/* Items List */}
                          <div>
                            <h4 className="font-semibold text-gray-500 mb-3 text-sm">المنتجات</h4>
                            <div className="space-y-3">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                  <div>
                                    <span className="font-bold text-gray-900">{item.name}</span>
                                    <span className="text-sm text-gray-500 mr-2">x {item.qty} كجم</span>
                                  </div>
                                  <div className="font-semibold text-emerald-600">
                                    {(item.price * item.qty).toFixed(2)} ج.م
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <span className="font-bold text-gray-700">الإجمالي النهائي</span>
                            <span className="text-xl font-black text-black">{order.total_price.toFixed(2)} ج.م</span>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
