// src/components/admin/OrderRadar.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAdminOrders } from '@/providers/AdminOrdersProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, ShoppingBag } from 'lucide-react';

export function OrderRadar() {
  const { newOrder, clearNewOrder } = useAdminOrders();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (newOrder) {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      timerRef.current = setTimeout(() => {
        clearNewOrder();
      }, 10000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [newOrder, clearNewOrder]);

  return (
    <AnimatePresence>
      {newOrder && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="fixed top-6 left-0 right-0 mx-auto z-50 w-full max-w-sm px-4"
          dir="rtl"
        >
          <div className="bg-white border-2 border-black shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-4 flex items-start gap-4">
            <div className="bg-green-100 text-green-600 p-3 rounded-xl shrink-0 animate-pulse">
              <BellRing className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-gray-900 text-base">طلب جديد وصل!</h3>
                  <p className="text-xs text-gray-500 font-bold mt-0.5">منذ لحظات</p>
                </div>
                <button 
                  onClick={() => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    clearNewOrder();
                  }}
                  className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-700 text-sm truncate max-w-[120px]">
                  {newOrder.customer_name}
                </span>
                <span className="font-black text-green-600 font-mono text-sm flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  {newOrder.total_price} ج.م
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
