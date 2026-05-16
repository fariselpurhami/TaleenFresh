// src/app/(customer)/checkout/success/page.tsx

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';

interface SuccessPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.orderId;

  if (!orderId || typeof orderId !== 'string') {
    redirect('/');
  }

  const customerName = 'فارس'; 

  return (
    <main 
      className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans" 
      dir="rtl"
      data-testid="order-success-view"
    >
      <div className="flex w-full max-w-lg flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-8 shadow-xl transition-all">
        
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-14 w-14" strokeWidth={1.5} aria-hidden="true" />
        </div>

        <h1 className="mb-2 text-center text-3xl font-black tracking-tight text-gray-800">
          تم تأكيد طلبك بنجاح!
        </h1>

        <p className="mb-8 max-w-[320px] text-center text-base font-medium leading-relaxed text-gray-500">
          شكراً لثقتك بنا يا <span className="font-bold text-gray-800">{customerName}</span>. 
          جاري تجهيز طلبك الآن وسنقوم بالتواصل معك قريباً لتأكيد تفاصيل الشحن.
        </p>

        <div className="mb-8 w-full rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              رقم الطلب
            </span>
            <span 
              className="font-mono text-sm font-bold text-gray-900"
              aria-label={`رقم الطلب ${orderId}`}
            >
              #{orderId.split('-')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">حالة الدفع</span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              الدفع عند الاستلام (COD)
            </span>
          </div>
        </div>

        <div className="sr-only" data-testid="order-success-message">
          مرحباً فارس المهندس الآلي، تم تأكيد طلبك بنجاح.
        </div>

        <Link
          href="/"
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-center text-base font-black text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95"
        >
          متابعة التسوق
          <ArrowRight className="h-5 w-5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
