// src/components/customer/floating-cart/PaymentFailureView.tsx

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface PaymentFailureViewProps {
  onRetry: () => void
}

export function PaymentFailureView({ onRetry }: PaymentFailureViewProps) {
  return (
    <motion.div
      key="failure-view"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex w-full flex-1 flex-col items-center justify-center bg-white p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="mb-6 rounded-full bg-red-50 p-6"
      >
        <X className="h-16 w-16 text-red-500" strokeWidth={2} />
      </motion.div>

      <h3 className="mb-3 text-2xl font-bold text-gray-800">فشلت عملية الدفع</h3>

      <p className="mb-10 max-w-[280px] text-sm font-medium text-gray-500">
        عذراً، لم نتمكن من إتمام عملية الدفع. يرجى التحقق من بيانات البطاقة أو
        المحاولة باختيار طريقة الدفع عند الاستلام.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="w-full max-w-[250px] rounded-2xl bg-gray-100 px-6 py-4 text-base font-black text-gray-800 transition-all hover:bg-gray-200 active:scale-95"
      >
        العودة للمحاولة
      </button>
    </motion.div>
  )
}
