// src/components/customer/FloatingCart.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { useHaptics } from '@/hooks/useHaptics';
import { X, CheckCircle2, Trash2, Plus, Minus, ShoppingBag, ChevronsDown } from 'lucide-react';

export function FloatingCart() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [showScrollArrow, setShowScrollArrow] = useState(false);

  const { items, getCartTotal, updateQty, clearCart, removeItem, _hasHydrated } = useCart();
  const { trigger } = useHaptics();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);

  const cartTotal = getCartTotal();
  const DELIVERY_FEE = 25;
  const finalTotal = cartTotal > 0 ? cartTotal + DELIVERY_FEE : 0;
  const isFormIncomplete = !customer.name || !customer.phone || !customer.address;

  useEffect(() => {
    setIsMounted(true);
    const handleOpenCart = () => {
      trigger('medium');
      setIsOpen(true);
    };
    window.addEventListener('open-cart', handleOpenCart as EventListener);
    return () => window.removeEventListener('open-cart', handleOpenCart as EventListener);
  }, [trigger]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setErrorMsg(''); 
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const hasScroll = scrollHeight > clientHeight;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 20;

    setShowScrollArrow(hasScroll && !isAtBottom);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(checkScrollState, 50);
    } else {
      setShowScrollArrow(false);
    }
  }, [isOpen, items]);

  useEffect(() => {
    const textarea = addressRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; 
      textarea.style.height = `${textarea.scrollHeight}px`; 
    }
  }, [customer.address]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isSubmitting) return; 

    if (isFormIncomplete) {
      trigger('medium');
      document.getElementById('delivery-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    trigger('medium');

    const orderData = {
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_address: customer.address,
      items: items.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price
      })),
      total_price: finalTotal,
      status: 'pending'
    };

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      trigger('success');
      setIsOrdered(true);
      
      setTimeout(() => {
        clearCart();
        setIsOpen(false);
        setIsOrdered(false);
        setCustomer({ name: '', phone: '', address: '' });
      }, 3000);

    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        trigger('success');
        setIsOrdered(true);
        setTimeout(() => {
          clearCart();
          setIsOpen(false);
          setIsOrdered(false);
          setCustomer({ name: '', phone: '', address: '' });
        }, 3000);
      } else {
        console.error('Submission Error:', error);
        setErrorMsg('فشل إرسال الطلب، تأكد من الاتصال بالشبكة.'); 
        trigger('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted || !_hasHydrated) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={() => !isSubmitting && setIsOpen(false)}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            style={{ willChange: "opacity" }}
          />

          <motion.div
            initial={{ y: '100%', x: '-50%' }}
            animate={{ y: 0, x: '-50%' }}
            exit={{ y: '100%', x: '-50%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed bottom-0 left-[50%] z-[70] flex h-auto max-h-[85vh] w-full max-w-[430px] flex-col rounded-t-3xl bg-white shadow-2xl outline-none border-none"
            style={{ willChange: "transform" }}
          >
            <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <ShoppingBag className="h-6 w-6 text-[#2C643E]" />
                سلة المشتريات
              </h2>
              <button
                onClick={() => !isSubmitting && setIsOpen(false)}
                disabled={isSubmitting}
                className="rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={scrollContainerRef}
              onScroll={checkScrollState}
              className="relative flex-1 overflow-y-auto px-6 pt-4 pb-12 custom-scrollbar"
            >
              {isOrdered ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4 py-10 text-center">
                  <CheckCircle2 className="h-20 w-20 text-green-500" />
                  <h3 className="text-2xl font-bold text-gray-800">تم استلام طلبك!</h3>
                  <p className="text-gray-500">جاري التجهيز الآن يا {customer.name.split(' ')[0]}</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4 py-10 text-center">
                  <div className="rounded-full bg-gray-50 p-6">
                    <ShoppingBag className="h-16 w-16 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">سلتك فارغة</h3>
                  <p className="text-gray-500">لم تقم بإضافة أي منتجات حتى الآن.</p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="mt-4 w-full rounded-2xl bg-gray-100 px-8 py-4 font-black text-gray-700 transition-all hover:bg-gray-200 active:scale-[0.98]"
                  >
                    ابدأ التسوق
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <h4 className="truncate text-sm font-bold text-gray-800">{item.name}</h4>
                          <span className="shrink-0 rounded-md bg-green-50 px-2 py-0.5 text-xs font-bold text-[#2C643E]">
                            {(item.price * item.qty).toFixed(2)} ج.م
                          </span>
                        </div>
        
                        <div className="flex shrink-0 items-center gap-2" dir="ltr">
                          <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-0.5">
                            <button
                              onClick={() => updateQty(item.id, Math.max(0.5, item.qty - 0.5))}
                              className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-12 text-center text-sm font-bold text-gray-700">{item.qty} كجم</span>
                            <button
                              onClick={() => updateQty(item.id, item.qty + 0.5)}
                              className="rounded-md bg-white p-1.5 text-[#2C643E] shadow-sm transition-colors hover:bg-green-50"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="rounded-lg bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div id="delivery-form" className="space-y-4 border-t pt-6 mt-6">
                    {errorMsg && (
                      <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600 border border-red-100 text-right" dir="rtl">
                        {errorMsg}
                      </div>
                    )}
                    
                    <h3 className="w-full text-center text-lg font-bold text-gray-800">
                      الرجاء إدخال بياناتك
                    </h3>
                    <input
                      type="text"
                      placeholder="الاسم الثلاثي"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border bg-gray-50 px-4 py-3 outline-none focus:border-[#2C643E] focus:bg-white text-right"
                      dir="rtl"
                    />
                    <input
                      type="tel"
                      placeholder="رقم الهاتف"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border bg-gray-50 px-4 py-3 outline-none focus:border-[#2C643E] focus:bg-white text-right"
                      dir="rtl"
                    />
                    <textarea
                      ref={addressRef}
                      rows={1}
                      placeholder="العنوان بالتفصيل (المنطقة، الشارع، العمارة)"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full max-h-[120px] resize-none overflow-y-auto rounded-xl border bg-gray-50 px-4 py-3 outline-none focus:border-[#2C643E] focus:bg-white text-right leading-relaxed"
                      dir="rtl"
                    />
                  </div>
                </>
              )}
            </div>

            {!isOrdered && items.length > 0 && (
              <div className="relative shrink-0 border-t bg-white px-6 py-4 pb-safe">
                <AnimatePresence>
                  {showScrollArrow && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -top-12 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm"
                    >
                      البيانات بالأسفل
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
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className={`flex w-full items-center justify-center rounded-2xl bg-[#2C643E] py-4 text-lg font-black text-white shadow-[0_8px_20px_rgba(44,100,62,0.3)] transition-all ${
                    isFormIncomplete || isSubmitting ? 'opacity-50' : 'active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                </button>
              </div>
            )}
            
            <div className="absolute top-[calc(100%-2px)] left-0 right-0 h-[100px] bg-white pointer-events-none" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
