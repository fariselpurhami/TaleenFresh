// src/app/(customer)/payment-callback/page.tsx

'use client';

import React, { useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, LucideIcon } from 'lucide-react';

type PaymentStatus = 'pending' | 'success' | 'failure';

interface PaymentMessagePayload {
  readonly type: 'PAYMOB_PAYMENT_RESULT';
  readonly success: boolean;
  readonly transactionId: string | null;
  readonly orderId: string | null;
}

interface StatusUIConfig {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly subtitle?: string;
  readonly iconClass: string;
  readonly containerClass: string;
}

const PAYMENT_MESSAGE_TYPE = 'PAYMOB_PAYMENT_RESULT';

const TARGET_ORIGIN = process.env.NEXT_PUBLIC_STORE_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');

const STATUS_UI_REGISTRY: Record<PaymentStatus, StatusUIConfig> = {
  pending: {
    icon: Loader2,
    title: 'جاري تأكيد الدفع...',
    subtitle: 'يرجى الانتظار، لا تقم بإغلاق هذه الصفحة.',
    iconClass: 'h-16 w-16 animate-spin text-emerald-700',
    containerClass: 'bg-emerald-50 text-emerald-900 border-emerald-100',
  },
  success: {
    icon: CheckCircle2,
    title: 'تم الدفع بنجاح',
    subtitle: 'جاري العودة للمتجر وإتمام الطلب...',
    iconClass: 'h-20 w-20 text-green-600',
    containerClass: 'bg-green-50 text-green-900 border-green-100',
  },
  failure: {
    icon: XCircle,
    title: 'فشلت عملية الدفع',
    subtitle: 'يرجى المحاولة مرة أخرى باستخدام طريقة دفع مختلفة.',
    iconClass: 'h-20 w-20 text-red-600',
    containerClass: 'bg-red-50 text-red-900 border-red-100',
  },
};

function usePaymentDispatcher(): { status: PaymentStatus } {
  const searchParams = useSearchParams();

  const status: PaymentStatus = useMemo(() => {
    const successParam = searchParams.get('success');
    if (!successParam) return 'pending';
    return successParam === 'true' ? 'success' : 'failure';
  }, [searchParams]);

  useEffect(() => {
    if (status === 'pending') return;

    if (typeof window === 'undefined' || window.parent === window) {
      console.warn('[PaymentCallback] Not running inside an iframe. Message will not be dispatched.');
      return;
    }

    if (!TARGET_ORIGIN || TARGET_ORIGIN === '*') {
      console.error('[PaymentCallback] CRITICAL: Insecure TARGET_ORIGIN configuration. Message dispatch aborted.');
      return;
    }

    const payload: PaymentMessagePayload = {
      type: PAYMENT_MESSAGE_TYPE,
      success: status === 'success',
      transactionId: searchParams.get('id'),
      orderId: searchParams.get('order'), 
    };

    try {
      window.parent.postMessage(payload, TARGET_ORIGIN);
    } catch (error) {
      console.error('[PaymentCallback] Failed to dispatch payment message to parent window:', error);
    }
  }, [searchParams, status]);

  return { status };
}

const LoadingFallback = () => (
  <div 
    className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center"
    role="status"
    aria-live="polite"
  >
    <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
    <p className="text-lg font-medium text-gray-600">جاري تحميل حالة الدفع...</p>
  </div>
);

function PaymentStatusView({ status }: { readonly status: PaymentStatus }) {
  const config = STATUS_UI_REGISTRY[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center w-full max-w-md p-8 rounded-2xl shadow-sm border ${config.containerClass}`}
      role="status"
      aria-live="polite"
    >
      <motion.div
        initial={{ y: -10 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Icon className={`${config.iconClass} mb-6`} strokeWidth={1.5} aria-hidden="true" />
      </motion.div>
      
      <h1 className="text-2xl font-bold mb-2 tracking-tight">
        {config.title}
      </h1>
      
      {config.subtitle && (
        <p className="text-sm opacity-80 font-medium text-center">
          {config.subtitle}
        </p>
      )}
    </motion.div>
  );
}

function CallbackController() {
  const { status } = usePaymentDispatcher();
  return <PaymentStatusView status={status} />;
}

export default function PaymentCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans" dir="rtl">
      <Suspense fallback={<LoadingFallback />}>
        <CallbackController />
      </Suspense>
    </main>
  );
}
