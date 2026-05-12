
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronsDown,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'
import { useCheckout } from '@/store/useCheckout'
import { useCart, selectCartTotal } from '@/hooks/useCart'
import { useHaptics } from '@/hooks/useHaptics'
import { supabase } from '@/lib/supabase/client'

type PaymentMethod = 'cod' | 'card'

interface OrderLineItem {
  name: string
  qty: number
  price: number
}

interface OrderPayload {
  customer_name: string
  customer_phone: string
  customer_address: string
  items: OrderLineItem[]
  total_price: number
  status: 'pending'
  payment_method: PaymentMethod
}

interface CheckoutApiResponse {
  url?: string
  error?: string
  message?: string
}

interface PaymobPaymentResultMessage {
  type: 'PAYMOB_PAYMENT_RESULT'
  success: boolean
}

const DELIVERY_FEE = 25
const FORM_VISIBILITY_THRESHOLD = 0.4
const NETWORK_TIMEOUT_MS = 3000
const ORDER_SUCCESS_CLOSE_DELAY_MS = 3000
const SCROLL_STATE_CHECK_DELAY_MS = 50
const OFFLINE_ORDERS_STORAGE_KEY = 'offline_orders'

function isOrderLineItem(value: unknown): value is OrderLineItem {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.name === 'string' &&
    typeof record.qty === 'number' &&
    typeof record.price === 'number'
  )
}

function isOrderPayload(value: unknown): value is OrderPayload {
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

function isPaymobPaymentResultMessage(value: unknown): value is PaymobPaymentResultMessage {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return record.type === 'PAYMOB_PAYMENT_RESULT' && typeof record.success === 'boolean'
}

function readOfflineOrders(): OrderPayload[] {
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

function writeOfflineOrders(orders: OrderPayload[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(OFFLINE_ORDERS_STORAGE_KEY, JSON.stringify(orders))
}

function clearOfflineOrders() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(OFFLINE_ORDERS_STORAGE_KEY)
}

export function FloatingCart() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOrdered, setIsOrdered] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [showScrollArrow, setShowScrollArrow] = useState(false)
  const [isPaymentFailed, setIsPaymentFailed] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(false)

  const { customerInfo, setCustomerInfo } = useCheckout()
  const items = useCart((state) => state.items)
  const updateQty = useCart((state) => state.updateQty)
  const clearCart = useCart((state) => state.clearCart)
  const removeItem = useCart((state) => state.removeItem)
  const hasHydrated = useCart((state) => state._hasHydrated)
  const cartTotal = useCart(selectCartTotal)
  const { trigger } = useHaptics()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const addressRef = useRef<HTMLTextAreaElement>(null)
  const formContainerRef = useRef<HTMLDivElement>(null)
  const successTimeoutRef = useRef<number | null>(null)
  const scrollStateTimeoutRef = useRef<number | null>(null)

  const finalTotal = useMemo(
    () => (cartTotal > 0 ? cartTotal + DELIVERY_FEE : 0),
    [cartTotal]
  )

  const isMissingInputs = useMemo(
    () =>
      !customerInfo.fullName.trim() ||
      !customerInfo.phone.trim() ||
      !customerInfo.address.trim(),
    [customerInfo.address, customerInfo.fullName, customerInfo.phone]
  )

  const isMissingPayment = paymentMethod === null
  const isFormIncomplete = isMissingInputs || isMissingPayment
  const firstCustomerName = useMemo(() => {
    const firstPart = customerInfo.fullName.trim().split(/\s+/)[0]
    return firstPart || 'عميلنا'
  }, [customerInfo.fullName])

  const showScrollHint = useMemo(
    () =>
      showScrollArrow &&
      isFormIncomplete &&
      ((isMissingInputs && !isFormVisible) || (!isMissingInputs && isMissingPayment)),
    [isFormIncomplete, isFormVisible, isMissingInputs, isMissingPayment, showScrollArrow]
  )

  const clearSuccessTimeout = useCallback(() => {
    if (successTimeoutRef.current !== null) {
      window.clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = null
    }
  }, [])

  const clearScrollStateTimeout = useCallback(() => {
    if (scrollStateTimeoutRef.current !== null) {
      window.clearTimeout(scrollStateTimeoutRef.current)
      scrollStateTimeoutRef.current = null
    }
  }, [])

  const resetCheckoutState = useCallback(() => {
    setIsSubmitting(false)
    setIsOrdered(false)
    setPaymentUrl(null)
    setErrorMsg('')
    setIsPaymentFailed(false)
  }, [])

  const resetCustomerState = useCallback(() => {
    setPaymentMethod(null)
  }, [])

  const resetPaymentFlow = useCallback(() => {
    setPaymentUrl(null)
    setIsPaymentFailed(false)
    setIsSubmitting(false)
    setErrorMsg('')
  }, [])

  const closeCart = useCallback(() => {
    clearSuccessTimeout()
    clearScrollStateTimeout()
    setIsOpen(false)
  }, [clearScrollStateTimeout, clearSuccessTimeout])

  const enqueueOfflineOrder = useCallback((orderData: OrderPayload) => {
    const existingOrders = readOfflineOrders()
    writeOfflineOrders([...existingOrders, orderData])
  }, [])

  const processOfflineQueue = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return

    const queuedOrders = readOfflineOrders()
    if (queuedOrders.length === 0) return

    const { error } = await supabase.from('orders').insert(queuedOrders)
    if (!error) {
      clearOfflineOrders()
    }
  }, [])

  const completeLocalSuccessFlow = useCallback(() => {
    clearSuccessTimeout()
    trigger('success')
    setIsOrdered(true)
    setIsSubmitting(false)
    setPaymentUrl(null)
    setErrorMsg('')
    setIsPaymentFailed(false)

    successTimeoutRef.current = window.setTimeout(() => {
      clearCart()
      setIsOpen(false)
      resetCheckoutState()
      resetCustomerState()
    }, ORDER_SUCCESS_CLOSE_DELAY_MS)
  }, [clearCart, clearSuccessTimeout, resetCheckoutState, resetCustomerState, trigger])

  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const hasScrollableContent = scrollHeight > clientHeight
    const isNearBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 20

    setShowScrollArrow(hasScrollableContent && !isNearBottom)
  }, [])

  const buildOrderPayload = useCallback((): OrderPayload => {
    return {
      customer_name: customerInfo.fullName.trim(),
      customer_phone: customerInfo.phone.trim(),
      customer_address: customerInfo.address.trim(),
      items: items.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
      })),
      total_price: finalTotal,
      status: 'pending',
      payment_method: paymentMethod as PaymentMethod,
    }
  }, [customerInfo.address, customerInfo.fullName, customerInfo.phone, finalTotal, items, paymentMethod])

  const handleCodCheckout = useCallback(
    async (orderData: OrderPayload) => {
      if (!navigator.onLine) {
        enqueueOfflineOrder(orderData)
        completeLocalSuccessFlow()
        return
      }

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS)

      try {
        const { error } = await supabase
          .from('orders')
          .insert([orderData])
          .abortSignal(controller.signal)

        if (error) {
          throw new Error(error.message)
        }

        completeLocalSuccessFlow()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء تنفيذ العملية'

        if (
          (error instanceof Error && error.name === 'AbortError') ||
          message.includes('Failed to fetch')
        ) {
          enqueueOfflineOrder(orderData)
          completeLocalSuccessFlow()
          return
        }

        setErrorMsg('عذراً، حدث خطأ في تسجيل الطلب. يرجى التأكد من البيانات أو المحاولة لاحقاً.')
        setIsSubmitting(false)
        trigger('error')
      } finally {
        window.clearTimeout(timeoutId)
      }
    },
    [completeLocalSuccessFlow, enqueueOfflineOrder, trigger]
  )

  const handleCardCheckout = useCallback(async (orderData: OrderPayload) => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    })

    const data = (await response.json().catch(() => null)) as CheckoutApiResponse | null

    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Payment initialization failed')
    }

    if (!data?.url) {
      throw new Error('Payment URL was not returned from the server')
    }

    setPaymentUrl(data.url)
    setIsSubmitting(false)
  }, [])

  const handleCheckout = useCallback(async () => {
    if (items.length === 0 || isSubmitting) return

    if (isFormIncomplete) {
      trigger('medium')
      formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const orderData = buildOrderPayload()

    setIsSubmitting(true)
    setErrorMsg('')
    trigger('medium')

    try {
      if (orderData.payment_method === 'card') {
        await handleCardCheckout(orderData)
        return
      }

      await handleCodCheckout(orderData)
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء تنفيذ العملية'
      )
      setIsSubmitting(false)
      trigger('error')
    }
  }, [
    buildOrderPayload,
    handleCardCheckout,
    handleCodCheckout,
    isFormIncomplete,
    isSubmitting,
    items.length,
    trigger,
  ])

  useEffect(() => {
    return () => {
      clearSuccessTimeout()
      clearScrollStateTimeout()
      document.body.style.overflow = ''
    }
  }, [clearScrollStateTimeout, clearSuccessTimeout])

  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setIsFormVisible(false)
      return
    }

    const targetNode = formContainerRef.current
    const rootNode = scrollContainerRef.current

    if (!targetNode) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        setIsFormVisible(Boolean(entry?.isIntersecting))
      },
      {
        root: rootNode,
        threshold: FORM_VISIBILITY_THRESHOLD,
      }
    )

    observer.observe(targetNode)

    return () => {
      observer.disconnect()
    }
  }, [isOpen, items.length])

  useEffect(() => {
    void processOfflineQueue()

    const scheduleOfflineSync = () => {
      window.requestAnimationFrame(() => {
        void processOfflineQueue()
      })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleOfflineSync()
      }
    }

    window.addEventListener('online', scheduleOfflineSync)
    window.addEventListener('focus', scheduleOfflineSync)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', scheduleOfflineSync)
      window.removeEventListener('focus', scheduleOfflineSync)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [processOfflineQueue])

  useEffect(() => {
    setIsMounted(true)

    const handleOpenCart = () => {
      trigger('medium')
      setIsOpen(true)
    }

    window.addEventListener('open-cart', handleOpenCart as EventListener)

    return () => {
      window.removeEventListener('open-cart', handleOpenCart as EventListener)
    }
  }, [trigger])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return
    }

    document.body.style.overflow = ''
    clearSuccessTimeout()
    clearScrollStateTimeout()
    resetCheckoutState()
  }, [clearScrollStateTimeout, clearSuccessTimeout, isOpen, resetCheckoutState])

  useEffect(() => {
    clearScrollStateTimeout()

    if (isOpen && !paymentUrl) {
      scrollStateTimeoutRef.current = window.setTimeout(
        checkScrollState,
        SCROLL_STATE_CHECK_DELAY_MS
      )
      return clearScrollStateTimeout
    }

    setShowScrollArrow(false)
  }, [checkScrollState, clearScrollStateTimeout, isOpen, items, paymentUrl])

  useEffect(() => {
    const textarea = addressRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [customerInfo.address])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (!isPaymobPaymentResultMessage(event.data)) return

      if (event.data.success) {
        completeLocalSuccessFlow()
        return
      }

      setPaymentUrl(null)
      setIsSubmitting(false)
      setIsPaymentFailed(true)
      setErrorMsg(
        'عذراً، فشلت عملية الدفع. يرجى المحاولة مرة أخرى أو اختيار الدفع عند الاستلام.'
      )
      trigger('error')
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [completeLocalSuccessFlow, trigger])

  if (!isMounted || !hasHydrated) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onClick={closeCart}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            data-testid="cart-container"
            initial={{ y: '100%', x: '-50%' }}
            animate={{ y: 0, x: '-50%' }}
            exit={{ y: '100%', x: '-50%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className={`fixed bottom-0 left-[50%] z-[70] flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-3xl border-none bg-white shadow-2xl outline-none transition-all duration-500 ${
              paymentUrl || isPaymentFailed ? 'h-[80vh] max-h-[80vh]' : 'h-auto max-h-[80vh]'
            }`}
          >
            <div className="z-10 flex shrink-0 items-center justify-between border-b bg-white px-6 py-4">
              <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
                {paymentUrl || isPaymentFailed ? (
                  <button
                    type="button"
                    onClick={resetPaymentFlow}
                    className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
                  >
                    <ArrowRight className="h-5 w-5" />
                    رجوع
                  </button>
                ) : isOrdered ? (
                  <span className="text-[#2C643E]">الطلب مكتمل</span>
                ) : (
                  <>
                    <ShoppingBag className="h-6 w-6 text-[#2C643E]" />
                    سلة المشتريات
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={closeCart}
                aria-label="إغلاق السلة"
                className="rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
              <AnimatePresence mode="wait">
                {paymentUrl ? (
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
                      title="بوابة الدفع"
                    />
                  </motion.div>
                ) : isPaymentFailed ? (
                  <motion.div
                    key="failure-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex w-full flex-1 flex-col items-center justify-center bg-white p-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                      className="mb-6 rounded-full bg-red-50 p-6"
                    >
                      <X className="h-16 w-16 text-red-500" strokeWidth={2} />
                    </motion.div>
                    <h3 className="mb-3 text-2xl font-bold text-gray-800">فشلت عملية الدفع</h3>
                    <p className="mb-10 max-w-[280px] text-sm font-medium text-gray-500">
                      عذراً، لم نتمكن من إتمام عملية الدفع. يرجى التحقق من بيانات البطاقة أو
                      المحاولة باختيار طريقة الدفع عند الاستلام.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaymentFailed(false)
                        setIsSubmitting(false)
                      }}
                      className="w-full max-w-[250px] rounded-2xl bg-gray-100 px-6 py-4 text-base font-black text-gray-800 transition-all hover:bg-gray-200 active:scale-95"
                    >
                      العودة للمحاولة
                    </button>
                  </motion.div>
                ) : isOrdered ? (
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
                      <CheckCircle2 className="mb-6 h-24 w-24 text-green-500" strokeWidth={1.5} />
                    </motion.div>
                    <h3 className="mb-2 text-2xl font-bold text-gray-800">تم استلام طلبك!</h3>
                    <p
                      data-testid="order-success-message"
                      className="font-medium text-gray-500"
                    >
                      جاري التجهيز الآن يا {firstCustomerName}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cart-view"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="flex min-h-0 w-full flex-1 flex-col"
                  >
                    <div
                      ref={scrollContainerRef}
                      onScroll={checkScrollState}
                      className="custom-scrollbar relative flex-1 overflow-y-auto px-6 pb-12 pt-4"
                    >
                      {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 py-10 text-center">
                          <div className="rounded-full bg-gray-50 p-6">
                            <ShoppingBag className="h-16 w-16 text-gray-300" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800">سلتك فارغة</h3>
                          <p className="text-gray-500">لم تقم بإضافة أي منتجات حتى الآن.</p>
                          <button
                            type="button"
                            onClick={closeCart}
                            className="mt-4 w-full rounded-2xl bg-gray-100 px-8 py-4 font-black text-gray-700 transition-all hover:bg-gray-200 active:scale-[0.98]"
                          >
                            ابدأ التسوق
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {items.map((item) => {
                              const isGrapeLeaves = item.name.includes('عنب')
                              const itemCategory = (item as { category?: string }).category
                              const unit =
                                itemCategory === 'leaf_greens' && !isGrapeLeaves ? 'حزمة' : 'كجم'
                              const step = unit === 'حزمة' ? 1 : 0.5
                              const minQty = unit === 'حزمة' ? 1 : 0.5

                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-3 rounded-2xl border p-3"
                                >
                                  <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <h4 className="truncate text-sm font-bold text-gray-800">
                                      {item.name}
                                    </h4>
                                    <span className="shrink-0 rounded-md bg-green-50 px-2 py-0.5 text-xs font-bold text-[#2C643E]">
                                      {(item.price * item.qty).toFixed(2)} ج.م
                                    </span>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-2" dir="ltr">
                                    <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-0.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateQty(item.id, Math.max(minQty, item.qty - step))
                                        }
                                        aria-label={`تقليل كمية ${item.name}`}
                                        className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                      </button>
                                      <span className="w-14 text-center text-sm font-bold text-gray-700">
                                        {item.qty} {unit}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => updateQty(item.id, item.qty + step)}
                                        aria-label={`زيادة كمية ${item.name}`}
                                        className="rounded-md bg-white p-1.5 text-[#2C643E] shadow-sm transition-colors hover:bg-green-50"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeItem(item.id)}
                                      aria-label={`حذف ${item.name}`}
                                      className="rounded-lg bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div
                            id="delivery-form"
                            ref={formContainerRef}
                            className="mt-6 space-y-4 border-t pt-6"
                          >
                            {errorMsg && (
                              <div
                                className="rounded-xl border border-red-100 bg-red-50 p-3 text-right text-sm font-bold text-red-600"
                                dir="rtl"
                              >
                                {errorMsg}
                              </div>
                            )}

                            <h3 className="w-full text-center text-lg font-bold text-gray-800">
                              الرجاء إدخال بياناتك
                            </h3>

                            <input
                              data-testid="input-customer-name"
                              type="text"
                              placeholder="الاسم الثلاثي"
                              value={customerInfo.fullName}
                              onChange={(event) =>
                                setCustomerInfo({ fullName: event.target.value })
                              }
                              disabled={isSubmitting}
                              className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-right outline-none focus:border-[#2C643E] focus:bg-white"
                              dir="rtl"
                            />

                            <input
                              data-testid="input-customer-phone"
                              type="tel"
                              placeholder="رقم الهاتف"
                              value={customerInfo.phone}
                              onChange={(event) =>
                                setCustomerInfo({ phone: event.target.value })
                              }
                              disabled={isSubmitting}
                              className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-right outline-none focus:border-[#2C643E] focus:bg-white"
                              dir="rtl"
                            />

                            <textarea
                              data-testid="input-customer-address"
                              ref={addressRef}
                              rows={1}
                              placeholder="العنوان بالتفصيل (المنطقة، الشارع، العمارة)"
                              value={customerInfo.address}
                              onChange={(event) =>
                                setCustomerInfo({ address: event.target.value })
                              }
                              disabled={isSubmitting}
                              className="max-h-[120px] w-full resize-none overflow-y-auto rounded-xl border bg-gray-50 px-4 py-3 text-right leading-relaxed outline-none focus:border-[#2C643E] focus:bg-white"
                              dir="rtl"
                            />
                          </div>

                          <div className="mb-2 mt-6 space-y-4 border-t pt-6">
                            <h3 className="w-full text-center text-lg font-bold text-gray-800">
                              طريقة الدفع
                            </h3>
                            <div className="grid grid-cols-2 gap-3" dir="rtl">
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('card')}
                                disabled={isSubmitting}
                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                                  paymentMethod === 'card'
                                    ? 'border-[#2C643E] bg-green-50 text-[#2C643E]'
                                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                                }`}
                              >
                                <CreditCard className="h-6 w-6" />
                                <span className="text-sm font-bold">بطاقة بنكية</span>
                              </button>

                              <button
                                type="button"
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
                        </>
                      )}
                    </div>

                    {items.length > 0 && (
                      <div className="relative shrink-0 border-t bg-white px-6 py-4 pb-safe">
                        <AnimatePresence>
                          {showScrollHint && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute -top-12 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm"
                            >
                              مرر لإستكمال الدفع
                              <ChevronsDown className="h-4 w-4 animate-bounce" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="mb-4 space-y-2 text-sm text-gray-600" dir="rtl">
                          <div className="flex justify-between">
                            <span>المجموع</span>
                            <span className="font-bold">{cartTotal.toFixed(2)} ج.م</span>
                          </div>
                          <div className="flex justify-between">
                            <span>رسوم التوصيل</span>
                            <span className="font-bold">{DELIVERY_FEE.toFixed(2)} ج.م</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 text-lg font-black text-gray-800">
                            <span>الإجمالي</span>
                            <span>{finalTotal.toFixed(2)} ج.م</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          data-testid="checkout-submit-button"
                          onClick={() => {
                            void handleCheckout()
                          }}
                          disabled={isSubmitting}
                          className={`flex w-full items-center justify-center rounded-2xl bg-[#2C643E] py-4 text-lg font-black text-white shadow-[0_8px_20px_rgba(44,100,62,0.3)] transition-all ${
                            isFormIncomplete || isSubmitting ? 'opacity-50' : 'active:scale-[0.98]'
                          }`}
                        >
                          {isSubmitting
                            ? 'جاري المعالجة...'
                            : paymentMethod === null
                              ? 'اختر طريقة الدفع'
                              : paymentMethod === 'card'
                                ? 'تأكيد الدفع'
                                : 'تأكيد الطلب'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
