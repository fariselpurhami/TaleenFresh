// src/components/customer/FloatingCart.tsx

'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ShoppingBag, X, ShieldCheck } from 'lucide-react'
import { useFloatingCartController } from '@/hooks/customer/useFloatingCartController'
import { DELIVERY_FEE } from '@/lib/customer/floating-cart-utils'
import { CartItemRow } from '@/components/customer/floating-cart/CartItemRow'
import { CartSummaryFooter } from '@/components/customer/floating-cart/CartSummaryFooter'
import { CheckoutForm } from '@/components/customer/floating-cart/CheckoutForm'
import { PaymentFailureView } from '@/components/customer/floating-cart/PaymentFailureView'
import { PaymentIframeView } from '@/components/customer/floating-cart/PaymentIframeView'
import { SuccessView } from '@/components/customer/floating-cart/SuccessView'

export function FloatingCart() {
  const {
    isOpen,
    isMounted,
    isSubmitting,
    isOrdered,
    paymentUrl,
    paymentMethod,
    showScrollHint,
    isPaymentFailed,
    customerInfo,
    items,
    hasHydrated,
    cartTotal,
    finalTotal,
    isFormIncomplete,
    firstCustomerName,
    scrollContainerRef,
    addressRef,
    formContainerRef,
    setCustomerInfo,
    setPaymentMethod,
    closeCart,
    resetPaymentFlow,
    retryAfterPaymentFailure,
    removeItem,
    updateQty,
    handleCheckout,
    checkScrollState,
    normalizePhoneNumber,
    errorMsg,
  } = useFloatingCartController()

  if (!isMounted || !hasHydrated) return null

  const checkoutButtonLabel = isSubmitting
    ? 'جاري المعالجة...'
    : paymentMethod === null
      ? 'اختر طريقة الدفع'
      : paymentMethod === 'card'
        ? 'تأكيد الدفع'
        : 'تأكيد الطلب'

  return (
    <AnimatePresence>
      {isOpen ? (
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
            initial={{ y: 100, x: '-50%', opacity: 0.98 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 100, x: '-50%', opacity: 0.98 }}
            transition={{
              y: { type: 'spring', damping: 30, stiffness: 320, mass: 0.5 },
              opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
              layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
            }}
            layout
            style={{ willChange: 'transform, opacity' }}
            className={`fixed bottom-0 left-1/2 z-[70] flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-3xl border-none bg-white shadow-2xl outline-none ${
              paymentUrl || isPaymentFailed
                ? 'h-[80vh] max-h-[80vh]'
                : 'h-auto max-h-[80vh]'
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
                    <span>رجوع</span>
                  </button>
                ) : isOrdered ? (
                  <span className="text-[#2C643E]">الطلب مكتمل</span>
                ) : (
                  <>
                    <ShoppingBag className="h-6 w-6 text-[#2C643E]" />
                    <span>سلة المشتريات</span>
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
                  <PaymentIframeView paymentUrl={paymentUrl} />
                ) : isPaymentFailed ? (
                  <PaymentFailureView onRetry={retryAfterPaymentFailure} />
                ) : isOrdered ? (
                  <SuccessView firstCustomerName={firstCustomerName} />
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

                          <h3 className="text-xl font-bold text-gray-800">
                            سلتك فارغة
                          </h3>

                          <p className="text-gray-500">
                            لم تقم بإضافة أي منتجات حتى الآن.
                          </p>

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
			  <div className="mb-4 flex items-start gap-3 rounded-2xl border border-green-600/20 bg-green-50/60 p-3.5 text-right" dir="rtl">
                            <ShieldCheck className="h-5 w-5 shrink-0 text-[#2C643E] mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-bold leading-relaxed text-gray-700">
                                استلم أوردرك، راجعه براحتك، ولو أي منتج معجبكش متستلموش وماتدفعش تمنه.
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {items.map((item) => (
                              <CartItemRow
                                key={item.id}
                                item={item}
                                updateQty={updateQty}
                                removeItem={removeItem}
                              />
                            ))}
                          </div>

                          <CheckoutForm
                            errorMsg={errorMsg}
                            isSubmitting={isSubmitting}
                            customerInfo={customerInfo}
                            paymentMethod={paymentMethod}
                            formContainerRef={formContainerRef}
                            addressRef={addressRef}
                            setCustomerInfo={setCustomerInfo}
                            setPaymentMethod={setPaymentMethod}
                            normalizePhoneNumber={normalizePhoneNumber}
                          />
                        </>
                      )}
                    </div>

                    {items.length > 0 ? (
                      <CartSummaryFooter
                        cartTotal={cartTotal}
                        finalTotal={finalTotal}
                        deliveryFee={DELIVERY_FEE}
                        showScrollHint={showScrollHint}
                        isFormIncomplete={isFormIncomplete}
                        isSubmitting={isSubmitting}
                        paymentMethodLabel={checkoutButtonLabel}
                        onCheckout={() => {
                          void handleCheckout()
                        }}
                      />
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
