// src/app/(customer)/payment-callback/page.tsx

'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, type LucideIcon, XCircle } from 'lucide-react'

type PaymentStatus = 'pending' | 'success' | 'failure'

interface StatusUIConfig {
  readonly icon: LucideIcon
  readonly title: string
  readonly subtitle?: string
  readonly iconClass: string
}

const STATUS_UI_REGISTRY: Record<PaymentStatus, StatusUIConfig> = {
  pending: {
    icon: Loader2,
    title: 'جاري تأكيد الدفع...',
    subtitle: 'يرجى الانتظار، لا تقم بإغلاق هذه الصفحة.',
    iconClass: 'h-16 w-16 animate-spin text-emerald-700',
  },
  success: {
    icon: CheckCircle2,
    title: 'تم الدفع بنجاح',
    subtitle: 'شكراً لك، تم تأكيد طلبك وسنقوم بتجهيزه فوراً.',
    iconClass: 'h-24 w-24 text-green-600',
  },
  failure: {
    icon: XCircle,
    title: 'فشلت عملية الدفع',
    subtitle: 'يرجى المحاولة مرة أخرى باستخدام طريقة دفع مختلفة.',
    iconClass: 'h-24 w-24 text-red-600',
  },
}

function CallbackController() {
  const searchParams = useSearchParams()
  const [isIframe, setIsIframe] = useState(true)

  const status: PaymentStatus = useMemo(() => {
    const successParam = searchParams.get('success')
    if (!successParam) return 'pending'
    return successParam === 'true' ? 'success' : 'failure'
  }, [searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const inIframe = window.parent !== window
    setIsIframe(inIframe)

    if (status === 'pending') return

    const currentOrigin = window.location.origin
    const payload = {
      type: 'PAYMOB_PAYMENT_RESULT',
      success: status === 'success',
      transactionId: searchParams.get('id'),
      orderId: searchParams.get('order'),
    }

    if (inIframe) {
      try {
        window.parent.postMessage(payload, currentOrigin)
      } catch (error) {
        console.error('Failed to postMessage to parent window:', error)
        window.location.replace(`/?payment_result=${status}`)
      }
    }
  }, [searchParams, status])

  if (isIframe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <Loader2 className="h-10 w-10 animate-spin text-[#2C643E]" aria-label="جاري التحميل" />
      </div>
    )
  }

  const config = STATUS_UI_REGISTRY[status]
  const Icon = config.icon

  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <Icon className={`${config.iconClass} mb-6`} strokeWidth={1.5} aria-hidden="true" />
      </motion.div>

      <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-800">{config.title}</h1>

      {config.subtitle && (
        <p className="mb-8 max-w-[280px] text-center text-sm font-medium leading-relaxed text-gray-500">
          {config.subtitle}
        </p>
      )}

      <Link
        href="/"
        className="w-full rounded-2xl bg-gray-100 px-6 py-4 text-center text-base font-black text-gray-800 transition-all hover:bg-gray-200 active:scale-95"
      >
        العودة للمتجر
      </Link>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans" dir="rtl">
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-[#2C643E]" aria-label="جاري التحميل" />}>
        <CallbackController />
      </Suspense>
    </main>
  )
}
