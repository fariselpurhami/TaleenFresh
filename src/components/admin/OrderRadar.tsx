// src/components/admin/OrderRadar.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, ShoppingBag } from 'lucide-react';

interface NewOrderPayload {
  id: string;
  customer_name: string;
  total_price: number;
}

export function OrderRadar() {
  const [newOrder, setNewOrder] = useState<NewOrderPayload | null>(null);
  
  // 1. استخدام useRef لحفظ الـ Timer ID لمنع تداخل الإشعارات (Race Conditions)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const notificationSound = new Audio('/notification.mp3');

    const channel = supabase
      .channel('global-order-radar')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as NewOrderPayload;
          
          // تشغيل الصوت
          notificationSound.play().catch((e) => 
            console.log('Audio autoplay blocked by browser until user interaction')
          );

          // عرض الطلب الجديد
          setNewOrder(order);

          // 2. تدمير أي عداد قديم كان شغال (Clear previous timeout)
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }

          // 3. بدء عداد جديد خاص بهذا الطلب فقط وحفظه في الـ Ref
          timerRef.current = setTimeout(() => {
            setNewOrder(null);
          }, 10000);
        }
      )
      .subscribe();

    // 4. وظيفة التنظيف (Cleanup Function) - تمنع تسريب الذاكرة عند إغلاق الصفحة
    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {newOrder && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-6 left-0 right-0 z-[100] mx-auto w-[90%] max-w-sm"
          dir="rtl"
        >
          <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-[0_20px_50px_rgba(34,197,94,0.2)] border-2 border-[#22c55e]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-[#22c55e] animate-pulse">
                  <BellRing size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">طلب جديد وصل!</h3>
                  <p className="text-xs font-bold text-gray-500">منذ لحظات</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  // تنظيف العداد يدوياً إذا قام المستخدم بإغلاق الإشعار بنفسه
                  if (timerRef.current) clearTimeout(timerRef.current);
                  setNewOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="mt-2 flex items-center justify-between rounded-xl bg-gray-50 p-3 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-700">
                <ShoppingBag size={16} className="text-[#22c55e]" />
                <span className="font-bold text-sm truncate max-w-[150px]">{newOrder.customer_name}</span>
              </div>
              <span className="font-black text-[#22c55e] shrink-0">{newOrder.total_price} ج.م</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
