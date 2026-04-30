// src/components/customer/FloatingCart.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/lib/supabase/client'; 
import { X, CheckCircle2, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

export function FloatingCart() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);

  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });

  const { items, getCartTotal, updateQty, clearCart, removeItem } = useCart();
  const { trigger } = useHaptics();
  
  const cartTotal = getCartTotal(); 
  const DELIVERY_FEE = 15; 
  const finalTotal = cartTotal > 0 ? cartTotal + DELIVERY_FEE : 0; 

  const isFormIncomplete = !customer.name || !customer.phone || !customer.address;

  // 1. مستمع فتح السلة
  useEffect(() => {
    setIsMounted(true);
    const handleOpenCart = () => {
      trigger('medium');
      setIsOpen(true);
    };
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, [trigger]);

  // 2. التدخل المعماري الجديد: جدار حماية السكرول (Scroll Lock)
  useEffect(() => {
    if (isOpen) {
      // تجميد الشاشة الخلفية لما السلة تفتح
      document.body.style.overflow = 'hidden';
      // إضافة padding عشان نمنع الشاشة من إنها تتهز (Layout Shift) لو كان في Scrollbar
      document.body.style.paddingRight = '0px'; 
    } else {
      // تحرير الشاشة الخلفية لما السلة تتقفل
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    // تنظيف (Cleanup) لو الزبون قفل المتصفح فجأة
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (isFormIncomplete) {
      trigger('medium');
      document.getElementById('delivery-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
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

    const { error } = await supabase.from('orders').insert([orderData]);

    if (error) {
      console.error('Submission Error:', error);
      alert('فشل إرسال الطلب، تأكد من الاتصال بالشبكة.');
      setIsSubmitting(false);
      return;
    }

    trigger('success');
    setIsOrdered(true);
    setIsSubmitting(false);
    
    setTimeout(() => {
      clearCart();
      setIsOpen(false);
      setIsOrdered(false);
      setCustomer({ name: '', phone: '', address: '' });
    }, 3000);
  };

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            dir="rtl"
            className="fixed bottom-0 left-0 right-0 z-[70] mx-auto flex max-h-[75vh] min-h-[50vh] w-full max-w-md flex-col rounded-t-[2.5rem] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overscroll-contain"
          >
            <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-200" />
            
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">سلة المشتريات</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-2 bg-gray-100 text-gray-500">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* ضفنا overscroll-contain هنا عشان نأكد على منع التسريب */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-6">
              {isOrdered ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-20 text-center flex flex-col items-center">
                  <CheckCircle2 size={80} className="text-[#22c55e] mb-4" />
                  <h3 className="text-2xl font-black text-gray-900">تم استلام طلبك!</h3>
                  <p className="text-gray-500 font-bold mt-2">جاري التجهيز الآن يا {customer.name.split(' ')[0]}</p>
                </motion.div>
              ) : items.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="bg-gray-50 p-6 rounded-full mb-5">
                    <ShoppingBag size={48} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">سلتك فارغة</h3>
                  <p className="text-gray-500 font-bold mb-8 text-sm">لم تقم بإضافة أي منتجات حتى الآن.</p>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="w-full rounded-2xl bg-gray-100 text-gray-700 px-8 py-4 font-black hover:bg-gray-200 active:scale-[0.98] transition-all"
                  >
                    ابدأ التسوق
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex flex-col gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-[16px] text-gray-900">{item.name}</div>
                          <div className="text-[16px] font-black text-[#22c55e]">{(item.price * item.qty).toFixed(2)} ج.م</div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-white px-2 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                            <button onClick={() => updateQty(item.id, item.qty + 0.5)} className="p-1 text-[#22c55e] hover:bg-green-50 rounded-lg transition-colors">
                              <Plus size={18} strokeWidth={2.5} />
                            </button>
                            <span className="font-black text-[16px] w-14 text-center">{item.qty} كجم</span>
                            <button onClick={() => updateQty(item.id, Math.max(0.5, item.qty - 0.5))} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <Minus size={18} strokeWidth={2.5} />
                            </button>
                          </div>
                          
                          <button onClick={() => removeItem(item.id)} className="flex items-center gap-1 text-red-500 bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors">
                            <Trash2 size={16} />
                            <span className="text-xs font-bold">حذف</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div id="delivery-form" className="space-y-4 pt-4 border-t border-gray-100 scroll-mt-6">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest text-center">يرجي ملئ البيانات</h4>
                    <div className="space-y-3">
                      <input 
                        required 
                        placeholder="الاسم بالكامل" 
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:ring-2 ring-[#22c55e]/30 font-bold text-[16px]"
                        value={customer.name}
                        onChange={(e) => setCustomer({...customer, name: e.target.value})}
                      />
                      <input 
                        required 
                        type="tel"
                        placeholder="رقم الموبايل" 
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:ring-2 ring-[#22c55e]/30 font-bold text-[16px] text-right"
                        value={customer.phone}
                        onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                      />
                      <input 
                        required 
                        placeholder="عنوان التوصيل بالتفصيل" 
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:ring-2 ring-[#22c55e]/30 font-bold text-[16px]"
                        value={customer.address}
                        onChange={(e) => setCustomer({...customer, address: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {!isOrdered && items.length > 0 && (
              <div className="p-6 pt-4 bg-white border-t border-gray-100 pb-10">
                <div className="space-y-2 mb-5 px-2">
                  <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
                    <span>المجموع</span>
                    <span>{cartTotal.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
                    <span>رسوم التوصيل</span>
                    <span>{DELIVERY_FEE.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100 text-2xl font-black text-gray-900">
                    <span>الإجمالي</span>
                    <span className="text-[#22c55e]">{finalTotal.toFixed(2)} ج.م</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className={`w-full rounded-2xl bg-[#22c55e] py-4 text-lg font-black text-white shadow-[0_8px_20px_rgba(34,197,94,0.3)] transition-all ${
                    isFormIncomplete ? 'opacity-50' : 'active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
