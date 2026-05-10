// src/components/customer/FloatingCart.tsx

'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '@/hooks/useCart'
import { useHaptics } from '@/hooks/useHaptics'
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
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type PaymentMethod = 'cod' | 'card'

interface CustomerInfo {
  readonly name: string
  readonly phone: string
  readonly address: string
}

interface OrderPayload {
  readonly customer_name: string
  readonly customer_phone: string
  readonly customer_address: string
  readonly items: ReadonlyArray<{
    readonly name: string
    readonly qty: number
    readonly price: number
  }>
  readonly total_price: number
  readonly status: 'pending'
  readonly payment_method: PaymentMethod
}

const DELIVERY_FEE = 25
const PAYMENT_MESSAGE_TYPE = 'PAYMOB_PAYMENT_RESULT'
const OFFLINE_STORAGE_KEY = 'offline_orders'

export function FloatingCart() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOrdered, setIsOrdered] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [customer, setCustomer] = useState<CustomerInfo>({ name: '', phone: '', address: '' })
  const [showScrollArrow, setShowScrollArrow] = useState(false)

  const { items, getCartTotal, updateQty, clearCart, removeItem, _hasHydrated } = useCart()
  const { trigger } = useHaptics()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const addressRef = useRef<HTMLTextAreaElement>(null)

  const cartTotal = getCartTotal()
  const finalTotal = useMemo(() => cartTotal > 0 ? cartTotal + DELIVERY_FEE : 0, [cartTotal])

  const isFormIncomplete = !customer.name.trim() || !customer.phone.trim() || !customer.address.trim()

  const resetCheckoutState = useCallback(() => {
    setIsSubmitting(false)
    setIsOrdered(false)
    setPaymentUrl(null)
    setErrorMsg('')
  }, [])

  const resetCustomerState = useCallback(() => {
    setCustomer({ name: '', phone: '', address: '' })
    setPaymentMethod('cod')
  }, [])

  const processOfflineQueue = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return

    const queueStr = localStorage.getItem(OFFLINE_STORAGE_KEY)
    if (!queueStr) return

    try {
      const queue = JSON.parse(queueStr) as OrderPayload[]
      if (!Array.isArray(queue) || queue.length === 0) return

      const { error } = await supabase.from('orders').insert(queue)
      if (!error) {
        localStorage.removeItem(OFFLINE_STORAGE_KEY)
      }
    } catch (e) {
      console.error('[FloatingCart] Failed to process offline queue', e)
    }
  }, [])

  useEffect(() => {
    processOfflineQueue()
    const triggerSync = () => requestAnimationFrame(processOfflineQueue)

    window.addEventListener('online', triggerSync)
    window.addEventListener('visibilitychange', triggerSync)
    window.addEventListener('focus', triggerSync)

    return () => {
      window.removeEventListener('online', triggerSync)
      window.removeEventListener('visibilitychange', triggerSync)
      window.removeEventListener('focus', triggerSync)
    }
  }, [processOfflineQueue])

  useEffect(() => {
    setIsMounted(true)
    const handleOpenCart = () => {
      trigger('medium')
      setIsOpen(true)
    }

    window.addEventListener('open-cart', handleOpenCart)
    return () => window.removeEventListener('open-cart', handleOpenCart)
  }, [trigger])

  useEffect(() => {
    if (typeof document === 'undefined') return

    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      resetCheckoutState()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, resetCheckoutState])

  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const hasScroll = scrollHeight > clientHeight
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 20

    setShowScrollArrow(hasScroll && !isAtBottom)
  }, [])

  useEffect(() => {
    if (isOpen && !paymentUrl) {
      const timer = setTimeout(checkScrollState, 50)
      return () => clearTimeout(timer)
    } else {
      setShowScrollArrow(false)
    }
  }, [isOpen, items.length, paymentUrl, checkScrollState])

  useEffect(() => {
    const textarea = addressRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [customer.address])

  const completeLocalSuccessFlow = useCallback(() => {
    trigger('success')
    setIsOrdered(true)
    setIsSubmitting(false)

    setTimeout(() => {
      clearCart()
      setIsOpen(false)
      resetCheckoutState()
      resetCustomerState()
    }, 3000)
  }, [trigger, clearCart, resetCheckoutState, resetCustomerState])

  useEffect(() => {
    const handlePaymentMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      const { data } = event
      if (data?.type === PAYMENT_MESSAGE_TYPE) {
        if (data.success) {
          setPaymentUrl(null)
          completeLocalSuccessFlow()
        } else {
          setPaymentUrl(null)
          setErrorMsg('فشلت عملية الدفع، يرجى المحاولة مرة أخرى أو اختيار وسيلة دفع أخرى.')
          trigger('error')
        }
      }
    }

    window.addEventListener('message', handlePaymentMessage)
    return () => window.removeEventListener('message', handlePaymentMessage)
  }, [trigger, completeLocalSuccessFlow])

  const enqueueOfflineOrder = useCallback((orderData: OrderPayload) => {
    try {
      const existingStr = localStorage.getItem(OFFLINE_STORAGE_KEY)
      const existingQueue: OrderPayload[] = existingStr ? JSON.parse(existingStr) : []
      existingQueue.push(orderData)
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(existingQueue))
    } catch (e) {
      console.error('[FloatingCart] Storage limits exceeded or serialization failed', e)
    }
  }, [])

  const handleCodCheckout = async (orderData: OrderPayload) => {
    if (!navigator.onLine) {
      enqueueOfflineOrder(orderData)
      completeLocalSuccessFlow()
      return
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const { error } = await supabase
        .from('orders')
        .insert([orderData])
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error) {
        throw new Error(error.message)
      }

      completeLocalSuccessFlow()
    } catch (err: unknown) {
      const isNetworkOrAbort = err instanceof Error && (err.name === 'AbortError' || err.message.includes('Failed to fetch'))

      if (isNetworkOrAbort) {
        enqueueOfflineOrder(orderData)
        completeLocalSuccessFlow()
      } else {
        console.error("[FloatingCart] Critical DB Error:", err)
        setErrorMsg("عذراً، حدث خطأ في تسجيل الطلب. يرجى التأكد من البيانات أو المحاولة لاحقاً.")
        setIsSubmitting(false)
        trigger('error')
      }
    }
  }

  const handleCardCheckout = async (orderData: OrderPayload) => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Payment initialization failed')
      }

      if (!data?.url || typeof data.url !== 'string') {
        throw new Error('Invalid payment URL returned from the server')
      }

      setPaymentUrl(data.url)
      setIsSubmitting(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown payment initialization error'
      setErrorMsg(msg)
      setIsSubmitting(false)
      trigger('error')
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0 || isSubmitting) return

    if (isFormIncomplete) {
      trigger('medium')
      document.getElementById('delivery-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    trigger('medium')

    const orderData: OrderPayload = {
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      customer_address: customer.address.trim(),
      items: items.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price
      })),
      total_price: finalTotal,
      status: 'pending',
      payment_method: paymentMethod
    }

    if (paymentMethod === 'card') {
      await handleCardCheckout(orderData)
    } else {
      await handleCodCheckout(orderData)
    }
  }

  if (!isMounted || !_hasHydrated) return null

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[90vh] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:inset-x-auto md:right-4 md:bottom-4 md:w-[450px] md:rounded-[2rem]"
              dir="rtl"
              role="dialog"
              aria-label="Shopping Cart"
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                {paymentUrl ? (
                  <button
                    onClick={() => setPaymentUrl(null)}
                    className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
                    type="button"
                  >
                    <ArrowRight className="h-5 w-5" />
                    <span className="font-medium">رجوع</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-[#2C643E]">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">سلة المشتريات</h2>
                  </div>
                )}
                <button
                  onClick={() => !isSubmitting && setIsOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-50"
                  type="button"
                  aria-label="Close Cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {paymentUrl ? (
                <div className="h-[600px] w-full bg-gray-50 flex flex-col relative">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#2C643E]" />
                      <p className="text-sm font-medium text-gray-500">جاري تحميل بوابة الدفع...</p>
                    </div>
                  </div>
                  <iframe
                    src={paymentUrl}
                    className="h-full w-full border-none z-10 bg-white"
                    title="Secure Payment Gateway"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    allow="payment"
                  />
                </div>
              ) : (
                <>
                  <div
                    ref={scrollContainerRef}
                    onScroll={checkScrollState}
                    className="flex-1 overflow-y-auto overscroll-contain bg-gray-50/50 p-6"
                  >
                    {isOrdered ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex h-full flex-col items-center justify-center py-12 text-center"
                      >
                        <div className="mb-6 rounded-full bg-green-100 p-4">
                          <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                        <h3 className="mb-2 text-2xl font-bold text-gray-900">تم استلام طلبك!</h3>
                        <p className="text-gray-500">
                          جاري التجهيز الآن يا {customer.name.trim().split(' ')[0]}
                        </p>
                      </motion.div>
                    ) : items.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                        <ShoppingBag className="mb-4 h-16 w-16 text-gray-300" />
                        <h3 className="mb-2 text-lg font-bold text-gray-900">سلتك فارغة</h3>
                        <p className="text-sm text-gray-500">لم تقم بإضافة أي منتجات حتى الآن.</p>
                        <button
                          onClick={() => setIsOpen(false)}
                          className="mt-4 w-full rounded-2xl bg-gray-100 px-8 py-4 font-black text-gray-700 transition-all hover:bg-gray-200 active:scale-[0.98]"
                          type="button"
                        >
                          ابدأ التسوق
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6 pb-20">
                        <div className="space-y-3">
                          {items.map((item) => {
                            const isGrapeLeaves = item.name.includes('عنب')
                            const unit = (item as any).category === 'leaf_greens' && !isGrapeLeaves ? 'حزمة' : 'كجم'
                            const step = unit === 'حزمة' ? 1 : 0.5
                            const minQty = unit === 'حزمة' ? 1 : 0.5

                            return (
                              <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm"
                              >
                                <div className="flex-1 px-3">
                                  <h4 className="font-bold text-gray-900">{item.name}</h4>
                                  <p className="text-sm font-medium text-[#2C643E]">
                                    {(item.price * item.qty).toFixed(2)} ج.م
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-1">
                                    <button
                                      onClick={() => updateQty(item.id, Math.max(minQty, item.qty - step))}
                                      className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                                      type="button"
                                      aria-label="Decrease Quantity"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-12 text-center font-bold text-gray-900">
                                      {item.qty} {unit}
                                    </span>
                                    <button
                                      onClick={() => updateQty(item.id, item.qty + step)}
                                      className="rounded-md bg-white p-1.5 text-[#2C643E] shadow-sm transition-colors hover:bg-green-50"
                                      type="button"
                                      aria-label="Increase Quantity"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="rounded-lg bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
                                    type="button"
                                    aria-label="Remove Item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>

                        {errorMsg && (
                          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                            {errorMsg}
                          </div>
                        )}

                        <form id="delivery-form" className="space-y-4 pt-4" onSubmit={handleCheckout}>
                          <h3 className="font-bold text-gray-900">الرجاء إدخال بياناتك</h3>
                          <div className="space-y-3">
                            <input
                              type="text"
                              required
                              placeholder="الاسم بالكامل"
                              value={customer.name}
                              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                              disabled={isSubmitting}
                              className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-right outline-none focus:border-[#2C643E] focus:bg-white"
                              dir="rtl"
                            />
                            <input
                              type="tel"
                              required
                              pattern="[0-9]{11}"
                              title="برجاء إدخال رقم هاتف صحيح (11 رقم)"
                              placeholder="رقم الهاتف (مثال: 01012345678)"
                              value={customer.phone}
                              onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '') })}
                              disabled={isSubmitting}
                              className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-right outline-none focus:border-[#2C643E] focus:bg-white"
                              dir="rtl"
                            />
                            <textarea
                              ref={addressRef}
                              required
                              placeholder="عنوان التوصيل بالتفصيل (المنطقة، الشارع، العمارة، الدور، الشقة)"
                              value={customer.address}
                              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                              disabled={isSubmitting}
                              rows={2}
                              className="max-h-[120px] min-h-[60px] w-full resize-none overflow-y-auto rounded-xl border bg-gray-50 px-4 py-3 text-right leading-relaxed outline-none focus:border-[#2C643E] focus:bg-white"
                              dir="rtl"
                            />
                          </div>

                          <div className="pt-2">
                            <h3 className="mb-3 font-bold text-gray-900">طريقة الدفع</h3>
                            <div className="grid grid-cols-2 gap-3">
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
                                <span className="font-bold">بطاقة بنكية</span>
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
                                <span className="font-bold">عند الاستلام</span>
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {!isOrdered && items.length > 0 && (
                    <div className="relative border-t bg-white p-6 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                      <AnimatePresence>
                        {showScrollArrow && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -top-12 left-1/2 flex -translate-x-1/2 flex-col items-center justify-center text-[#2C643E]"
                          >
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold shadow-sm">
                              البيانات بالأسفل
                            </span>
                            <ChevronsDown className="mt-1 h-5 w-5 animate-bounce" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mb-4 space-y-2 text-sm font-medium text-gray-600">
                        <div className="flex justify-between">
                          <span>المجموع</span>
                          <span>{cartTotal.toFixed(2)} ج.م</span>
                        </div>
                        <div className="flex justify-between">
                          <span>رسوم التوصيل</span>
                          <span>{DELIVERY_FEE.toFixed(2)} ج.م</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 text-lg font-bold text-gray-900">
                          <span>الإجمالي</span>
                          <span>{finalTotal.toFixed(2)} ج.م</span>
                        </div>
                      </div>

                      <button
                        onClick={handleCheckout}
                        disabled={isSubmitting || isFormIncomplete}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2C643E] px-8 py-4 font-black text-white shadow-lg shadow-green-900/20 transition-all hover:bg-[#235332] hover:shadow-green-900/30 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                        type="button"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : paymentMethod === 'card' ? (
                          'تأكيد الدفع'
                        ) : (
                          'تأكيد الطلب'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
