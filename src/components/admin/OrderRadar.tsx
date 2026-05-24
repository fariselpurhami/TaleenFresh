// src/components/admin/OrderRadar.tsx

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, Phone, ShoppingBag, X } from 'lucide-react';
import { useAdminOrders } from '@/providers/AdminOrdersProvider';

const AUTO_DISMISS_MS = 10000;
const PHONE_ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const moneyFormatter = new Intl.NumberFormat('ar-EG');

const normalizePhoneNumber = (value: string): string =>
  value.replace(/[٠-٩]/g, (digit) => String(PHONE_ARABIC_DIGITS.indexOf(digit)));

export function OrderRadar() {
  const { newOrder, clearNewOrder } = useAdminOrders();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOrderIdRef = useRef<string | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    clearDismissTimer();
    clearNewOrder();
  }, [clearDismissTimer, clearNewOrder]);

  useEffect(() => {
    if (!newOrder) {
      lastOrderIdRef.current = null;
      clearDismissTimer();
      return;
    }

    if (lastOrderIdRef.current === newOrder.id) {
      return;
    }

    lastOrderIdRef.current = newOrder.id;
    clearDismissTimer();

    timerRef.current = setTimeout(() => {
      clearNewOrder();
      timerRef.current = null;
    }, AUTO_DISMISS_MS);

    return clearDismissTimer;
  }, [newOrder, clearDismissTimer, clearNewOrder]);

  if (!newOrder) {
    return null;
  }

  const customerName = newOrder.customer_name.trim() || 'عميل';
  const totalPrice = Number.isFinite(newOrder.total_price) ? newOrder.total_price : 0;
  const phoneNumber = normalizePhoneNumber(newOrder.customer_phone);

  return (
    <AnimatePresence>
      <motion.aside
        key={newOrder.id}
        initial={{ opacity: 0, y: -24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="fixed left-0 right-0 top-6 z-50 mx-auto w-full max-w-sm px-4"
        dir="rtl"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_12px_36px_rgba(0,0,0,0.14)]">
          <div
            className="flex shrink-0 items-center justify-center rounded-xl bg-emerald-100 p-3 text-emerald-700"
            aria-hidden="true"
          >
            <BellRing className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black leading-tight text-gray-900">
                  طلب جديد وصل الآن
                </h3>
                <p className="mt-0.5 text-xs font-bold text-gray-500">منذ لحظات</p>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="إغلاق تنبيه الطلب الجديد"
                className="shrink-0 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-800">{customerName}</p>
                {phoneNumber ? (
                  <a
                    href={`tel:${phoneNumber}`}
                    dir="ltr"
                    className="mt-1 inline-flex items-center gap-1.5 rounded-md text-xs font-bold text-gray-600 underline-offset-2 hover:text-emerald-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {phoneNumber}
                  </a>
                ) : null}
              </div>

              <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 font-mono text-sm font-black text-emerald-700">
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                {moneyFormatter.format(totalPrice)} ج.م
              </span>
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
