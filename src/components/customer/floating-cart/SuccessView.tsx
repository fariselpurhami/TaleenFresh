// src/components/customer/floating-cart/SuccessView.tsx

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface SuccessViewProps {
  firstCustomerName: string
}

export function SuccessView({ firstCustomerName }: SuccessViewProps) {
  return (
    <motion.div
      key="success-view"
      data-testid="order-success-view"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex w-full flex-col items-center justify-center bg-white p-10 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
      >
        <CheckCircle2
          className="mb-6 h-24 w-24 text-green-500"
          strokeWidth={1.5}
        />
      </motion.div>

      <h3 className="mb-2 text-2xl font-bold text-gray-800">
        تم استلام طلبك!
      </h3>

      <p
        data-testid="order-success-message"
        className="font-medium text-gray-500"
      >
        جاري التجهيز الآن يا {firstCustomerName}
      </p>
    </motion.div>
  )
}
