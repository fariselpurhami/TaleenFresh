// src/types/customer/floating-cart.ts

export type PaymentMethod = 'cod' | 'card'

export interface OrderLineItem {
  name: string
  qty: number
  price: number
}

export interface OrderPayload {
  customer_name: string
  customer_phone: string
  customer_address: string
  items: OrderLineItem[]
  total_price: number
  status: 'pending'
  payment_method: PaymentMethod
}

export interface CheckoutApiResponse {
  url?: string
  error?: string
  message?: string
}

export interface PaymobPaymentResultMessage {
  type: 'PAYMOB_PAYMENT_RESULT'
  success: boolean
}

export interface CartDisplayItem {
  id: string 
  name: string
  qty: number
  price: number
  category?: string
}
