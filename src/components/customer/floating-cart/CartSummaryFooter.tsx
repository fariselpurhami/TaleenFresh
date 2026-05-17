// src/components/customer/floating-cart/CartSummaryFooter.tsx

'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronsDown } from 'lucide-react'

interface CartSummaryFooterProps {
  cartTotal: number
  finalTotal: number
  deliveryFee: number
  showScrollHint: boolean
  isFormIncomplete: boolean
  isSubmitting: boolean
  paymentMethodLabel: string
  onCheckout: () => void
}

export function CartSummaryFooter({
  cartTotal,
  finalTotal,
  deliveryFee,
  showScrollHint,
  isFormIncomplete,
  isSubmitting,
  paymentMethodLabel,
  onCheckout,
}: CartSummaryFooterProps) {
  return (
    <div className="relative shrink-0 border-t bg-white px-6 py-4 pb-safe">
      <AnimatePresence>
        {showScrollHint ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm"
          >
            <ChevronsDown className="h-4 w-4 animate-bounce" />
            <span>مرر لإستكمال الدفع</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mb-4 space-y-2 text-sm text-gray-600" dir="rtl">
        <div className="flex justify-between">
          <span>المجموع</span>
          <span className="font-bold">{cartTotal.toFixed(2)} ج.م</span>
        </div>

        <div className="flex justify-between">
          <span>رسوم التوصيل</span>
          <span className="font-bold">{deliveryFee.toFixed(2)} ج.م</span>
        </div>

        <div className="flex justify-between border-t pt-2 text-lg font-black text-gray-800">
          <span>الإجمالي</span>
          <span>{finalTotal.toFixed(2)} ج.م</span>
        </div>
      </div>

      <button
        type="button"
        data-testid="checkout-submit-button"
        onClick={() => void onCheckout()}
        disabled={isSubmitting}
        className={`flex w-full items-center justify-center rounded-2xl bg-[#2C643E] py-4 text-lg font-black text-white shadow-[0_8px_20px_rgba(44,100,62,0.3)] transition-all ${
          isFormIncomplete || isSubmitting ? 'opacity-50' : 'active:scale-[0.98]'
        }`}
      >
        {isSubmitting ? 'جاري المعالجة...' : paymentMethodLabel}
      </button>
    </div>
  )
}
