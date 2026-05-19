// src/hooks/customer/useFloatingCartController.ts

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCheckout } from '@/store/useCheckout'
import { useCart, selectCartTotal } from '@/hooks/useCart'
import { useHaptics } from '@/hooks/useHaptics'
import type {
  CartDisplayItem,
  CheckoutApiResponse,
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
  SCROLL_STATE_CHECK_DELAY_MS,
} from '@/lib/customer/floating-cart-utils'

interface FloatingCartController {
  isOpen: boolean
  isMounted: boolean
  isSubmitting: boolean
  isOrdered: boolean
  errorMsg: string
  paymentUrl: string | null
  paymentMethod: PaymentMethod | null
  showScrollArrow: boolean
  isPaymentFailed: boolean
  isFormVisible: boolean
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  }
  items: CartDisplayItem[]
  hasHydrated: boolean
  cartTotal: number
  finalTotal: number
  isMissingInputs: boolean
  isMissingPayment: boolean
  isFormIncomplete: boolean
  firstCustomerName: string
  showScrollHint: boolean
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  addressRef: React.RefObject<HTMLTextAreaElement | null>
  formContainerRef: React.RefObject<HTMLDivElement | null>
  setCustomerInfo: (info: Partial<{ name: string; phone: string; address: string }>) => void;
  setPaymentMethod: (method: PaymentMethod | null) => void
  openCart: () => void
  closeCart: () => void
  resetPaymentFlow: () => void
  retryAfterPaymentFailure: () => void
  updateQty: (id: string, qty: number) => void; 
  removeItem: (id: string) => void; 
  handleCheckout: () => Promise<void>
  checkScrollState: () => void
  normalizePhoneNumber: (value: string) => string
}

// Fallback for environments lacking secure context crypto support
const generateIdempotencyKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `idemp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
}

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
  const scrollStateTimeoutRef = useRef<number | null>(null)

  const finalTotal = useMemo(
    () => (cartTotal > 0 ? cartTotal + DELIVERY_FEE : 0),
    [cartTotal],
  )

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
    return firstPart || 'عميلنا'
  }, [customerInfo.name])

  const showScrollHint = useMemo(
    () =>
      showScrollArrow &&
      isFormIncomplete &&
      ((isMissingInputs && !isFormVisible) ||
        (!isMissingInputs && isMissingPayment)),
    [
      isFormIncomplete,
      isFormVisible,
      isMissingInputs,
      isMissingPayment,
      showScrollArrow,
    ],
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
    clearSuccessTimeout();
    clearScrollStateTimeout();

    if (isOrdered) {
      clearCart();
      resetCheckoutState();
      resetCustomerState();
    }

    setIsOpen(false);
  }, [
    clearCart,
    clearScrollStateTimeout,
    clearSuccessTimeout,
    isOrdered,
    resetCheckoutState,
    resetCustomerState
  ]);

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

    successTimeoutRef.current = window.setTimeout(() => {
      clearCart()
      setIsOpen(false)
      resetCheckoutState()
      resetCustomerState()
    }, ORDER_SUCCESS_CLOSE_DELAY_MS)
  }, [
    clearCart,
    clearSuccessTimeout,
    resetCheckoutState,
    resetCustomerState,
    trigger,
  ])

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
      customer_name: customerInfo.name.trim(),
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
  }, [
    customerInfo.address,
    customerInfo.name,
    customerInfo.phone,
    finalTotal,
    items,
    paymentMethod,
  ])

  const handleCodCheckout = useCallback(
    async (orderData: OrderPayload) => {
      if (!navigator.onLine) {
        setErrorMsg('أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.');
        setIsSubmitting(false);
        trigger('error');
        return;
      }

      const controller = new AbortController()
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        NETWORK_TIMEOUT_MS || 15000,
      )

      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Idempotency-Key': generateIdempotencyKey()
          },
          body: JSON.stringify(orderData),
          signal: controller.signal,
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          if (response.status === 409) throw new Error('PRICE_MISMATCH')
          throw new Error(data?.error || 'فشل تسجيل الطلب')
        }

        // Transaction fully verified by backend. Proceed to clear state.
        completeLocalSuccessFlow()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'

        if (error instanceof Error && error.name === 'AbortError') {
          setErrorMsg('انتهت مهلة الاتصال بسبب ضعف شبكة الإنترنت. طلبك لا يزال في السلة، يرجى المحاولة مرة أخرى.');
        } else if (message === 'PRICE_MISMATCH') {
          setErrorMsg('عذراً، بعض المنتجات لم تعد متوفرة أو تغير سعرها، يرجى تحديث السلة.');
        } else {
          setErrorMsg('عذراً، حدث خطأ في تسجيل الطلب. يرجى التأكد من البيانات أو المحاولة لاحقاً.');
        }

        setIsSubmitting(false)
        trigger('error')
      } finally {
        window.clearTimeout(timeoutId)
      }
    },
    [completeLocalSuccessFlow, trigger],
  )

  const handleCardCheckout = useCallback(async (orderData: OrderPayload) => {
    if (!navigator.onLine) {
      setErrorMsg('أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.');
      setIsSubmitting(false);
      trigger('error');
      return;
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      NETWORK_TIMEOUT_MS || 15000,
    )

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': generateIdempotencyKey()
        },
        body: JSON.stringify(orderData),
        signal: controller.signal,
      })

      const data = (await response
        .json()
        .catch(() => null)) as CheckoutApiResponse | null

      if (!response.ok) {
        if (response.status === 409) throw new Error('PRICE_MISMATCH')
        throw new Error(data?.error || data?.message || 'Payment initialization failed')
      }

      if (!data?.url) {
        throw new Error('Payment URL was not returned from the server')
      }

      setPaymentUrl(data.url)
      setIsSubmitting(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'

      if (error instanceof Error && error.name === 'AbortError') {
        setErrorMsg('انتهت مهلة الاتصال بسبب ضعف شبكة الإنترنت. طلبك لا يزال في السلة، يرجى المحاولة مرة أخرى.');
      } else if (message === 'PRICE_MISMATCH') {
        setErrorMsg('عذراً، بعض المنتجات لم تعد متوفرة أو تغير سعرها، يرجى تحديث السلة.');
      } else {
        setErrorMsg('عذراً، حدث خطأ في تسجيل الطلب. يرجى التأكد من البيانات أو المحاولة لاحقاً.');
      }

      setIsSubmitting(false)
      trigger('error')
    } finally {
      window.clearTimeout(timeoutId)
    }
  }, [trigger])

  const handleCheckout = useCallback(async () => {
    if (items.length === 0 || isSubmitting) return

    if (isFormIncomplete) {
      trigger('medium')
      formContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }

    const normalizedPhone = customerInfo.phone.trim();
    const canonicalPhone = normalizedPhone.startsWith('+20')
      ? `0${normalizedPhone.slice(3).replace(/\D/g, '')}`
      : normalizedPhone.startsWith('0020')
        ? `0${normalizedPhone.slice(4).replace(/\D/g, '')}`
        : normalizedPhone.replace(/\D/g, '');

    const isValidEgyptMobilePhone = /^01[0125]\d{8}$/.test(canonicalPhone);

    if (!isValidEgyptMobilePhone) {
      setErrorMsg('برجاء إدخال رقم هاتف مصري صحيح مكون من ١١ رقم (مثال: 01012345678)');
      trigger('error');
      formContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
      return;
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
      // Top level boundary catch (most errors handled in domain-specific functions)
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
    customerInfo.phone
  ])

  const retryAfterPaymentFailure = useCallback(() => {
    setIsPaymentFailed(false)
    setIsSubmitting(false)
  }, [])

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
      },
    )

    observer.observe(targetNode)

    return () => {
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
    clearScrollStateTimeout()
    resetCheckoutState()
  }, [
    clearScrollStateTimeout,
    clearSuccessTimeout,
    isOpen,
    resetCheckoutState,
  ])

  useEffect(() => {
    clearScrollStateTimeout()

    if (isOpen && !paymentUrl) {
      scrollStateTimeoutRef.current = window.setTimeout(
        checkScrollState,
        SCROLL_STATE_CHECK_DELAY_MS,
      )
      return clearScrollStateTimeout
    }

    setShowScrollArrow(false)
  }, [
    checkScrollState,
    clearScrollStateTimeout,
    isOpen,
    items,
    paymentUrl,
  ])

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
        'عذراً، فشلت عملية الدفع. يرجى المحاولة مرة أخرى أو اختيار الدفع عند الاستلام.',
      )
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
