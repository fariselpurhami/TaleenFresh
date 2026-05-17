// src/lib/customer/floating-cart-utils.ts

import {
  OrderLineItem,
  OrderPayload,
  PaymobPaymentResultMessage,
} from '@/types/customer/floating-cart'

export const DELIVERY_FEE = 25
export const FORM_VISIBILITY_THRESHOLD = 0.4
export const NETWORK_TIMEOUT_MS = 3000
export const ORDER_SUCCESS_CLOSE_DELAY_MS = 3000
export const SCROLL_STATE_CHECK_DELAY_MS = 50
export const OFFLINE_ORDERS_STORAGE_KEY = 'offline_orders'

export const normalizePhoneNumber = (value: string): string => {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/\s+/g, '')
    .replace(/(?!^)\+/g, '')
    .replace(/[^\d+]/g, '')
}

export function isOrderLineItem(value: unknown): value is OrderLineItem {
  if (typeof value !== 'object' || value === null) return false

  const record = value as Record<string, unknown>

  return (
    typeof record.name === 'string' &&
    typeof record.qty === 'number' &&
    typeof record.price === 'number'
  )
}

export function isOrderPayload(value: unknown): value is OrderPayload {
  if (typeof value !== 'object' || value === null) return false

  const record = value as Record<string, unknown>

  return (
    typeof record.customer_name === 'string' &&
    typeof record.customer_phone === 'string' &&
    typeof record.customer_address === 'string' &&
    Array.isArray(record.items) &&
    record.items.every(isOrderLineItem) &&
    typeof record.total_price === 'number' &&
    record.status === 'pending' &&
    (record.payment_method === 'cod' || record.payment_method === 'card')
  )
}

export function isPaymobPaymentResultMessage(
  value: unknown,
): value is PaymobPaymentResultMessage {
  if (typeof value !== 'object' || value === null) return false

  const record = value as Record<string, unknown>

  return (
    record.type === 'PAYMOB_PAYMENT_RESULT' &&
    typeof record.success === 'boolean'
  )
}

export function readOfflineOrders(): OrderPayload[] {
  if (typeof window === 'undefined') return []

  const raw = window.localStorage.getItem(OFFLINE_ORDERS_STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isOrderPayload) : []
  } catch {
    return []
  }
}

export function writeOfflineOrders(orders: OrderPayload[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(OFFLINE_ORDERS_STORAGE_KEY, JSON.stringify(orders))
}

export function clearOfflineOrders(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(OFFLINE_ORDERS_STORAGE_KEY)
}

export function getItemUnit(name: string, category?: string): 'حزمة' | 'كجم' {
  const isGrapeLeaves = name.includes('عنب')
  return category === 'leaf_greens' && !isGrapeLeaves ? 'حزمة' : 'كجم'
}

export function getItemStep(unit: 'حزمة' | 'كجم'): number {
  return unit === 'حزمة' ? 1 : 0.5
}

export function getItemMinQty(unit: 'حزمة' | 'كجم'): number {
  return unit === 'حزمة' ? 1 : 0.5
}
