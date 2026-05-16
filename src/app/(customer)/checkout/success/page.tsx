// src/app/(customer)/checkout/success/page.tsx
'use client'

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const displayOrderId = orderId || 'MOCK-123';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'PAYMOB_PAYMENT_RESULT',
          success: true,
          orderId: displayOrderId,
        },
        window.location.origin
      );
    }
  }, [displayOrderId]);

  return (
    <div className="flex w-full max-w-lg flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-8 shadow-xl transition-all">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-14 w-14" strokeWidth={1.5} aria-hidden="true" />
      </div>

      <h1 className="mb-2 text-center text-3xl font-black tracking-tight text-gray-800">
        تم تأكيد طلبك بنجاح!
      </h1>

      <p className="mb-8 max-w-[320px] text-center text-base font-medium leading-relaxed text-gray-500">
        جاري تجهيز طلبك الآن وسنقوم بالتواصل معك قريباً لتأكيد تفاصيل الشحن.
      </p>

      <div className="mb-8 w-full rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            رقم الطلب
          </span>
          <span 
            className="font-mono text-sm font-bold text-gray-900"
            aria-label={`رقم الطلب ${displayOrderId}`}
          >
            #{displayOrderId}
          </span>
        </div>
      </div>

      <div className="sr-only" data-testid="order-success-message">
        تم تأكيد طلبك بنجاح.
      </div>

      <Link
        href="/"
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-center text-base font-black text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:scale-95"
      >
        متابعة التسوق
        <ArrowRight className="h-5 w-5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
      </Link>
    </div>
  );
}

function SuccessSkeleton() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
      <div className="mb-6 h-24 w-24 animate-pulse rounded-full bg-gray-200" />
      <div className="mb-2 h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="mb-8 h-4 w-64 animate-pulse rounded-lg bg-gray-200" />
      <div className="mb-8 h-16 w-full animate-pulse rounded-2xl bg-gray-100" />
      <div className="h-14 w-full animate-pulse rounded-2xl bg-emerald-200" />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main 
      className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans" 
      dir="rtl" 
      data-testid="order-success-view"
    >
      <Suspense fallback={<SuccessSkeleton />}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
