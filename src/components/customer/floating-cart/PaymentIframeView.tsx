// src/components/customer/floating-cart/PaymentIframeView.tsx

'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface PaymentIframeViewProps {
  paymentUrl: string
}

export function PaymentIframeView({ paymentUrl }: PaymentIframeViewProps) {
  return (
    <motion.div
      key="iframe-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="relative flex-1 w-full overflow-hidden bg-white p-0"
    >
      <div className="absolute inset-0 flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2C643E] border-t-transparent" />
          <p className="text-sm font-bold text-gray-500">
            جاري تحميل بوابة الدفع...
          </p>
        </div>
      </div>

      <iframe
        src={paymentUrl}
        className="relative z-10 m-0 block h-full w-full border-none p-0"
        style={{ height: '100%', width: '100%', marginTop: '-5px' }}
        allow="payment"
        title="Payment gateway"
      />
    </motion.div>
  )
}
