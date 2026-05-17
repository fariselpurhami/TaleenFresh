// src/components/customer/floating-cart/CheckoutForm.tsx

'use client'

import React from 'react'
import { Banknote, CreditCard } from 'lucide-react'
import type { PaymentMethod } from '@/types/customer/floating-cart'

interface CheckoutFormProps {
  errorMsg: string
  isSubmitting: boolean
  customerInfo: {
    name: string
    phone: string
    address: string
  }
  paymentMethod: PaymentMethod | null
  formContainerRef: React.RefObject<HTMLDivElement | null>
  addressRef: React.RefObject<HTMLTextAreaElement | null>
  setCustomerInfo: (partial: {
    name?: string
    phone?: string
    address?: string
  }) => void
  setPaymentMethod: (method: PaymentMethod) => void
  normalizePhoneNumber: (value: string) => string
}

export function CheckoutForm({
  errorMsg,
  isSubmitting,
  customerInfo,
  paymentMethod,
  formContainerRef,
  addressRef,
  setCustomerInfo,
  setPaymentMethod,
  normalizePhoneNumber,
}: CheckoutFormProps) {
  return (
    <div
      id="delivery-form"
      ref={formContainerRef}
      className="mt-6 space-y-4 border-t pt-6"
    >
      {errorMsg ? (
        <div
          className="rounded-xl border border-red-100 bg-red-50 p-3 text-right text-sm font-bold text-red-600"
          dir="rtl"
        >
          {errorMsg}
        </div>
      ) : null}

      <h3 className="w-full text-center text-lg font-bold text-gray-800">
        الرجاء إدخال بياناتك
      </h3>

      <input
        data-testid="input-customer-name"
        type="text"
        placeholder="الاسم"
        value={customerInfo.name}
        onChange={(event) => setCustomerInfo({ name: event.target.value })}
        disabled={isSubmitting}
        className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-right outline-none focus:border-[#2C643E] focus:bg-white"
        dir="rtl"
        autoComplete="name"
      />

      <input
        data-testid="input-customer-phone"
        type="tel"
        placeholder="رقم الهاتف"
        value={customerInfo.phone}
        onChange={(event) =>
          setCustomerInfo({
            phone: normalizePhoneNumber(event.target.value),
          })
        }
        disabled={isSubmitting}
        className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-right outline-none focus:border-[#2C643E] focus:bg-white"
        dir="rtl"
        autoComplete="tel"
        inputMode="tel"
      />

      <textarea
        data-testid="input-customer-address"
        ref={addressRef}
        rows={1}
        placeholder="العنوان بالتفصيل"
        value={customerInfo.address}
        onChange={(event) => setCustomerInfo({ address: event.target.value })}
        disabled={isSubmitting}
        className="max-h-[120px] w-full resize-none overflow-y-auto rounded-xl border bg-gray-50 px-4 py-3 text-right leading-relaxed outline-none focus:border-[#2C643E] focus:bg-white"
        dir="rtl"
        autoComplete="street-address"
      />

      <div className="mb-2 mt-6 space-y-4 border-t pt-6">
        <h3 className="w-full text-center text-lg font-bold text-gray-800">
          طريقة الدفع
        </h3>

        <div className="grid grid-cols-2 gap-3" dir="rtl">
          <button
            type="button"
            data-testid="payment-method-card"
            onClick={() => setPaymentMethod('card')}
            disabled
            className="relative flex cursor-not-allowed select-none flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/40 p-4 text-gray-400 opacity-60"
          >
            <span className="absolute right-2 top-2 rounded-md bg-gray-200/70 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-gray-500">
              قريباً
            </span>
            <CreditCard className="h-6 w-6" />
            <span className="text-sm font-bold">بطاقة بنكية</span>
          </button>

          <button
            type="button"
            data-testid="payment-method-cod"
            onClick={() => setPaymentMethod('cod')}
            disabled={isSubmitting}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
              paymentMethod === 'cod'
                ? 'border-[#2C643E] bg-green-50 text-[#2C643E]'
                : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Banknote className="h-6 w-6" />
            <span className="text-sm font-bold">عند الاستلام</span>
          </button>
        </div>
      </div>
    </div>
  )
}
