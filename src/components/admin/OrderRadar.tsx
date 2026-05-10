// src/components/admin/OrderRadar.tsx

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAdminOrders } from '@/providers/AdminOrdersProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, ShoppingBag } from 'lucide-react';

export function OrderRadar() {
  const { newOrder, clearNewOrder } = useAdminOrders();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    clearNewOrder();
  }, [clearNewOrder]);

  useEffect(() => {
    if (newOrder) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        clearNewOrder();
      }, 10000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [newOrder, clearNewOrder]);

  return (
    <AnimatePresence>
      {newOrder && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed left-0 right-0 top-6 z-50 mx-auto w-full max-w-sm px-4"
          dir="rtl"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-4 rounded-2xl border-2 border-black bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div
              className="flex shrink-0 items-center justify-center rounded-xl bg-green-100 p-3 text-green-600 shadow-sm"
              aria-hidden="true"
            >
              <BellRing className="h-6 w-6 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-gray-900 leading-tight">طلب جديد وصل!</h3>
                  <p className="mt-0.5 text-xs font-bold text-gray-500">منذ لحظات</p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 shrink-0"
                  aria-label="إغلاق التنبيه"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2.5 shadow-sm">
                <span className="max-w-[120px] truncate text-sm font-bold text-gray-700">
                  {newOrder.customer_name || 'عميل'}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-sm font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md shrink-0">
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  {Number(newOrder.total_price || 0).toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
