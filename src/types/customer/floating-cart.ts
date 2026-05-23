// src/types/customer/floating-cart.ts

import type { RefObject } from 'react'

export type PaymentMethod = 'cod' | 'card'

export type OrderStatus = 'pending'

export interface OrderLineItem {
  readonly name: string
  readonly qty: number
  readonly price: number
}

export interface OrderPayload {
  readonly customer_name: string
  readonly customer_phone: string
  readonly customer_address: string
  readonly items: ReadonlyArray<OrderLineItem>
  readonly total_price: number
  readonly status: OrderStatus
  readonly payment_method: PaymentMethod
}

export interface CheckoutApiResponse {
  readonly url?: string
  readonly error?: string
  readonly message?: string
}

export interface PaymobPaymentResultMessage {
  readonly type: 'PAYMOB_PAYMENT_RESULT'
  readonly success: boolean
}

export interface CartDisplayItem {
  readonly id: string
  readonly name: string
  readonly qty: number
  readonly price: number
  readonly category?: string
}

export interface CustomerInfo {
  readonly name: string
  readonly phone: string
  readonly address: string
}

export interface CustomerInfoPatch {
  readonly name?: string
  readonly phone?: string
  readonly address?: string
}

export interface FloatingCartController {
  readonly isOpen: boolean
  readonly isMounted: boolean
  readonly isSubmitting: boolean
  readonly isOrdered: boolean
  readonly errorMsg: string
  readonly paymentUrl: string | null
  readonly paymentMethod: PaymentMethod | null
  readonly showScrollArrow: boolean
  readonly isPaymentFailed: boolean
  readonly isFormVisible: boolean
  readonly customerInfo: CustomerInfo
  readonly items: ReadonlyArray<CartDisplayItem>
  readonly hasHydrated: boolean
  readonly cartTotal: number
  readonly finalTotal: number
  readonly isMissingInputs: boolean
  readonly isMissingPayment: boolean
  readonly isFormIncomplete: boolean
  readonly firstCustomerName: string
  readonly showScrollHint: boolean
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>
  readonly addressRef: RefObject<HTMLTextAreaElement | null>
  readonly formContainerRef: RefObject<HTMLDivElement | null>
  readonly setCustomerInfo: (info: CustomerInfoPatch) => void
  readonly setPaymentMethod: (method: PaymentMethod | null) => void
  readonly openCart: () => void
  readonly closeCart: () => void
  readonly resetPaymentFlow: () => void
  readonly retryAfterPaymentFailure: () => void
  readonly updateQty: (id: string, qty: number) => void
  readonly removeItem: (id: string) => void
  readonly handleCheckout: () => Promise<void>
  readonly checkScrollState: () => void
  readonly normalizePhoneNumber: (value: string) => string
}
