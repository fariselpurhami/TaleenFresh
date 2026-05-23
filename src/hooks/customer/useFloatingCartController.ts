// src/hooks/customer/useFloatingCartController.ts

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCheckout } from '@/store/useCheckout'
import { useCart, selectCartTotal } from '@/hooks/useCart'
import { useHaptics } from '@/hooks/useHaptics'
import { supabase } from '@/lib/supabase/client'
import type {
  CartDisplayItem,
  CheckoutApiResponse,
  FloatingCartController,
  OrderPayload,
  PaymentMethod,
} from '@/types/customer/floating-cart'
import {
  DELIVERY_FEE,
  FORM_VISIBILITY_THRESHOLD,
  isPaymobPaymentResultMessage,
  NETWORK_TIMEOUT_MS,
  normalizePhoneNumber,
  ORDER_SUCCESS_CLOSE_DELAY_MS,
} from '@/lib/customer/floating-cart-utils'

const SESSION_STORAGE_KEY = 'tf_session_id'
const TRACKING_DEBOUNCE_MS = 1500
const SCROLL_BOTTOM_THRESHOLD_PX = 20
const RESIZE_SETTLE_DELAY_MS = 350
const EGYPT_MOBILE_PHONE_REGEX = /^01[0125]\d{8}$/
const ARABIC_DEFAULT_CUSTOMER_NAME = 'عميلنا'

const generateIdempotencyKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `idemp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
}

const isBrowser = (): boolean => typeof window !== 'undefined'

const safeGetLocalStorage = (): Storage | null => {
  if (!isBrowser()) {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

const getOrCreateSessionId = (): string => {
  const storage = safeGetLocalStorage()
  if (!storage) {
    return generateIdempotencyKey()
  }

  const existing = storage.getItem(SESSION_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const next = generateIdempotencyKey()
  storage.setItem(SESSION_STORAGE_KEY, next)
  return next
}

const clearTrackedSessionId = (): void => {
  const storage = safeGetLocalStorage()
  storage?.removeItem(SESSION_STORAGE_KEY)
}

const toCanonicalEgyptMobile = (value: string): string => {
  const normalized = value.trim()
  if (normalized.startsWith('+20')) {
    return `0${normalized.slice(3).replace(/\D/g, '')}`
  }
  if (normalized.startsWith('0020')) {
    return `0${normalized.slice(4).replace(/\D/g, '')}`
  }
  return normalized.replace(/\D/g, '')
}

const isValidEgyptMobilePhone = (value: string): boolean =>
  EGYPT_MOBILE_PHONE_REGEX.test(toCanonicalEgyptMobile(value))

const buildTrackingStatus = (itemsCount: number, isOrdered: boolean): 'active' | 'abandoned' | 'converted' => {
  if (isOrdered) {
    return 'converted'
  }
  return itemsCount > 0 ? 'active' : 'abandoned'
}

const sanitizeTrackedCustomerInfo = (customerInfo: { name: string; phone: string; address: string }) => ({
  name: customerInfo.name.trim(),
  phone: normalizePhoneNumber(customerInfo.phone.trim()),
  address: customerInfo.address.trim(),
})

export function useFloatingCartController(): FloatingCartController {
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
  const items = useCart((state) => state.items) as CartDisplayItem[]
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
  const trackingTimeoutRef = useRef<number | null>(null)
  const resizeSettleTimeoutRef = useRef<number | null>(null)
  const resizeAnimationFrameRef = useRef<number | null>(null)

  const finalTotal = useMemo(() => (cartTotal > 0 ? cartTotal + DELIVERY_FEE : 0), [cartTotal])

  const isMissingInputs = useMemo(
    () =>
      !customerInfo.name.trim() ||
      !customerInfo.phone.trim() ||
      !customerInfo.address.trim(),
    [customerInfo.address, customerInfo.name, customerInfo.phone],
  )

  const isMissingPayment = paymentMethod === null
  const isFormIncomplete = isMissingInputs || isMissingPayment

  const firstCustomerName = useMemo(() => {
    const firstPart = customerInfo.name.trim().split(/\s+/)[0]
    return firstPart || ARABIC_DEFAULT_CUSTOMER_NAME
  }, [customerInfo.name])

  const showScrollHint = useMemo(
    () =>
      showScrollArrow &&
      isFormIncomplete &&
      ((isMissingInputs && !isFormVisible) || (!isMissingInputs && isMissingPayment)),
    [isFormIncomplete, isFormVisible, isMissingInputs, isMissingPayment, showScrollArrow],
  )

  const clearSuccessTimeout = useCallback(() => {
    if (!isBrowser()) {
      return
    }
    if (successTimeoutRef.current !== null) {
      window.clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = null
    }
  }, [])

  const clearTrackingTimeout = useCallback(() => {
    if (!isBrowser()) {
      return
    }
    if (trackingTimeoutRef.current !== null) {
      window.clearTimeout(trackingTimeoutRef.current)
      trackingTimeoutRef.current = null
    }
  }, [])

  const clearResizeObserversWork = useCallback(() => {
    if (!isBrowser()) {
      return
    }
    if (resizeSettleTimeoutRef.current !== null) {
      window.clearTimeout(resizeSettleTimeoutRef.current)
      resizeSettleTimeoutRef.current = null
    }
    if (resizeAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(resizeAnimationFrameRef.current)
      resizeAnimationFrameRef.current = null
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

  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = container
    const hasScrollableContent = scrollHeight > clientHeight
    const isNearBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < SCROLL_BOTTOM_THRESHOLD_PX

    setShowScrollArrow(hasScrollableContent && !isNearBottom)
  }, [])

  const syncCartSession = useCallback(
    async (statusOverride?: 'active' | 'abandoned' | 'converted') => {
      const sessionId = getOrCreateSessionId()
      const status = statusOverride ?? buildTrackingStatus(items.length, isOrdered)

      await supabase.from('cart_sessions').upsert(
        {
          session_id: sessionId,
          cart_items: items,
          cart_total: cartTotal,
          customer_info: sanitizeTrackedCustomerInfo(customerInfo),
          status,
        },
        { onConflict: 'session_id' },
      )
    },
    [cartTotal, customerInfo, isOrdered, items],
  )

  const closeCart = useCallback(() => {
    clearSuccessTimeout()
    clearTrackingTimeout()
    clearResizeObserversWork()

    if (isOrdered) {
      clearCart()
      resetCheckoutState()
      resetCustomerState()
    }

    setIsOpen(false)
  }, [
    clearCart,
    clearResizeObserversWork,
    clearSuccessTimeout,
    clearTrackingTimeout,
    isOrdered,
    resetCheckoutState,
    resetCustomerState,
  ])

  const openCart = useCallback(() => {
    trigger('medium')
    setIsOpen(true)
  }, [trigger])

  const completeLocalSuccessFlow = useCallback(() => {
    clearSuccessTimeout()
    trigger('success')
    setIsOrdered(true)
    setIsSubmitting(false)
    setPaymentUrl(null)
    setErrorMsg('')
    setIsPaymentFailed(false)

    void syncCartSession('converted').catch(() => undefined)

    if (!isBrowser()) {
      return
    }

    successTimeoutRef.current = window.setTimeout(() => {
      clearCart()
      setIsOpen(false)
      resetCheckoutState()
      resetCustomerState()
      clearTrackedSessionId()
    }, ORDER_SUCCESS_CLOSE_DELAY_MS)
  }, [clearCart, clearSuccessTimeout, resetCheckoutState, resetCustomerState, syncCartSession, trigger])

  const buildOrderPayload = useCallback((): OrderPayload => {
    const sanitizedPhone = normalizePhoneNumber(customerInfo.phone.trim())

    return {
      customer_name: customerInfo.name.trim(),
      customer_phone: sanitizedPhone,
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
  }, [customerInfo.address, customerInfo.name, customerInfo.phone, finalTotal, items, paymentMethod])

  const postCheckout = useCallback(async (orderData: OrderPayload): Promise<CheckoutApiResponse | null> => {
    if (!navigator.onLine) {
      throw new Error('OFFLINE')
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS || 15000)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': generateIdempotencyKey(),
        },
        body: JSON.stringify(orderData),
        signal: controller.signal,
      })

      const data = (await response.json().catch(() => null)) as CheckoutApiResponse | null

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('PRICE_MISMATCH')
        }
        throw new Error(data?.error || data?.message || 'CHECKOUT_REQUEST_FAILED')
      }

      return data
    } finally {
      window.clearTimeout(timeoutId)
    }
  }, [])

  const resolveCheckoutError = useCallback((error: unknown): string => {
    if (error instanceof Error && error.name === 'AbortError') {
      return 'انتهت مهلة الاتصال بسبب ضعف شبكة الإنترنت. طلبك لا يزال في السلة، يرجى المحاولة مرة أخرى.'
    }

    if (error instanceof Error) {
      if (error.message === 'OFFLINE') {
        return 'أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.'
      }
      if (error.message === 'PRICE_MISMATCH') {
        return 'عذراً، بعض المنتجات لم تعد متوفرة أو تغير سعرها، يرجى تحديث السلة.'
      }
    }

    return 'عذراً، حدث خطأ في تسجيل الطلب. يرجى التأكد من البيانات أو المحاولة لاحقاً.'
  }, [])

  const handleCodCheckout = useCallback(
    async (orderData: OrderPayload) => {
      try {
        await postCheckout(orderData)
        completeLocalSuccessFlow()
      } catch (error) {
        setErrorMsg(resolveCheckoutError(error))
        setIsSubmitting(false)
        trigger('error')
      }
    },
    [completeLocalSuccessFlow, postCheckout, resolveCheckoutError, trigger],
  )

  const handleCardCheckout = useCallback(
    async (orderData: OrderPayload) => {
      try {
        const data = await postCheckout(orderData)

        if (!data?.url) {
          throw new Error('MISSING_PAYMENT_URL')
        }

        setPaymentUrl(data.url)
        setIsSubmitting(false)
      } catch (error) {
        setErrorMsg(
          error instanceof Error && error.message === 'MISSING_PAYMENT_URL'
            ? 'تعذر تهيئة رابط الدفع. يرجى المحاولة مرة أخرى.'
            : resolveCheckoutError(error),
        )
        setIsSubmitting(false)
        trigger('error')
      }
    },
    [postCheckout, resolveCheckoutError, trigger],
  )

  const handleCheckout = useCallback(async () => {
    if (items.length === 0 || isSubmitting) {
      return
    }

    if (isFormIncomplete) {
      trigger('medium')
      formContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }

    if (!isValidEgyptMobilePhone(customerInfo.phone)) {
      setErrorMsg('برجاء إدخال رقم هاتف مصري صحيح مكون من ١١ رقم (مثال: 01012345678)')
      trigger('error')
      formContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
      return
    }

    const orderData = buildOrderPayload()

    setIsSubmitting(true)
    setErrorMsg('')
    trigger('medium')

    if (orderData.payment_method === 'card') {
      await handleCardCheckout(orderData)
      return
    }

    await handleCodCheckout(orderData)
  }, [
    buildOrderPayload,
    customerInfo.phone,
    handleCardCheckout,
    handleCodCheckout,
    isFormIncomplete,
    isSubmitting,
    items.length,
    trigger,
  ])

  const retryAfterPaymentFailure = useCallback(() => {
    setIsPaymentFailed(false)
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    return () => {
      clearSuccessTimeout()
      clearTrackingTimeout()
      clearResizeObserversWork()
      document.body.style.overflow = ''
    }
  }, [clearResizeObserversWork, clearSuccessTimeout, clearTrackingTimeout])

  useEffect(() => {
    if (!hasHydrated || !isMounted) {
      return
    }

    clearTrackingTimeout()

    if (items.length === 0 && isOrdered) {
      return
    }

    trackingTimeoutRef.current = window.setTimeout(() => {
      void syncCartSession().catch(() => undefined)
    }, TRACKING_DEBOUNCE_MS)

    return () => {
      clearTrackingTimeout()
    }
  }, [cartTotal, clearTrackingTimeout, customerInfo, hasHydrated, isMounted, isOrdered, items, syncCartSession])

  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setIsFormVisible(false)
      return
    }

    const targetNode = formContainerRef.current
    const rootNode = scrollContainerRef.current

    if (!targetNode) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsFormVisible(Boolean(entry?.isIntersecting))
      },
      {
        root: rootNode,
        threshold: FORM_VISIBILITY_THRESHOLD,
      },
    )

    observer.observe(targetNode)

    return () => {
      observer.unobserve(targetNode)
      observer.disconnect()
    }
  }, [isOpen, items.length])

  useEffect(() => {
    setIsMounted(true)
    window.addEventListener('open-cart', openCart as EventListener)

    return () => {
      window.removeEventListener('open-cart', openCart as EventListener)
    }
  }, [openCart])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return
    }

    document.body.style.overflow = ''
    clearSuccessTimeout()
    clearResizeObserversWork()
    resetCheckoutState()
  }, [clearResizeObserversWork, clearSuccessTimeout, isOpen, resetCheckoutState])

  useEffect(() => {
    if (!isOpen || paymentUrl) {
      setShowScrollArrow(false)
      return
    }

    const container = scrollContainerRef.current
    if (!container) {
      return
    }

    const scheduleScrollStateCheck = () => {
      clearResizeObserversWork()
      resizeAnimationFrameRef.current = window.requestAnimationFrame(() => {
        checkScrollState()
      })
    }

    resizeSettleTimeoutRef.current = window.setTimeout(scheduleScrollStateCheck, RESIZE_SETTLE_DELAY_MS)

    const resizeObserver = new ResizeObserver(() => {
      scheduleScrollStateCheck()
    })

    resizeObserver.observe(container)

    const firstChild = container.firstElementChild
    if (firstChild) {
      resizeObserver.observe(firstChild)
    }

    return () => {
      resizeObserver.disconnect()
      clearResizeObserversWork()
    }
  }, [checkScrollState, clearResizeObserversWork, isOpen, paymentUrl])

  useEffect(() => {
    const textarea = addressRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [customerInfo.address])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return
      }

      if (!isPaymobPaymentResultMessage(event.data)) {
        return
      }

      if (event.data.success) {
        completeLocalSuccessFlow()
        return
      }

      setPaymentUrl(null)
      setIsSubmitting(false)
      setIsPaymentFailed(true)
      setErrorMsg('عذراً، فشلت عملية الدفع. يرجى المحاولة مرة أخرى أو اختيار الدفع عند الاستلام.')
      trigger('error')
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [completeLocalSuccessFlow, trigger])

  return {
    isOpen,
    isMounted,
    isSubmitting,
    isOrdered,
    errorMsg,
    paymentUrl,
    paymentMethod,
    showScrollArrow,
    isPaymentFailed,
    isFormVisible,
    customerInfo,
    items,
    hasHydrated,
    cartTotal,
    finalTotal,
    isMissingInputs,
    isMissingPayment,
    isFormIncomplete,
    firstCustomerName,
    showScrollHint,
    scrollContainerRef,
    addressRef,
    formContainerRef,
    setCustomerInfo,
    setPaymentMethod,
    openCart,
    closeCart,
    resetPaymentFlow,
    retryAfterPaymentFailure,
    updateQty,
    removeItem,
    handleCheckout,
    checkScrollState,
    normalizePhoneNumber,
  }
}
