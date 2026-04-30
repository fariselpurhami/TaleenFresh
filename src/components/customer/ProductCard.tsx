// src/components/customer/ProductCard.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  priority?: boolean;
}

export function ProductCard({ id, name, price, imageUrl, isAvailable, priority = false }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    if (!isAvailable) return;
    
    // إرسال حدث لتهتز السلة العائمة في Storefront
    window.dispatchEvent(new CustomEvent('cart-bounce'));
    
    addItem({ id, name, price });
    
    // تأثير بصري رائع (Micro-interaction) لتأكيد الإضافة
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 800);
  };

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.97 }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] bg-white p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50 h-[280px] transition-shadow hover:shadow-[0_8px_30px_rgb(34,197,94,0.12)] ${
        !isAvailable ? 'opacity-50 grayscale' : ''
      }`}
    >
      {/* خصم جذاب بتصميم iOS */}
      <div className="absolute top-0 left-0 bg-gradient-to-br from-[#22c55e] to-green-600 text-white text-[11px] font-black tracking-wide px-3.5 py-1.5 rounded-br-[1.2rem] rounded-tl-[1.5rem] z-10 shadow-sm">
        10% خصم
      </div>

      {/* صورة المنتج مع مساحة بيضاء تبرز جمالها */}
      <div className="relative h-36 w-full mb-3 mt-4 flex items-center justify-center bg-transparent">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-contain transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
          priority={priority}
        />
      </div>

      {/* معلومات المنتج والزر - هيكلة جديدة */}
      <div className="flex flex-col gap-2 mt-auto w-full">
        {/* الاسم */}
        <h3 className="font-bold text-gray-800 text-[15px] line-clamp-1 text-right w-full">
          {name}
        </h3>
        
        {/* السعر مرتب بشكل فخم */}
        <div className="flex flex-col items-start w-full min-w-0">
          <div className="flex items-baseline flex-nowrap w-full text-right truncate">
            <span className="text-[#22c55e] font-black text-[17px] tracking-tight shrink-1">
              {price.toFixed(2)}
            </span>
            <div className="flex items-baseline gap-0.5 shrink-0 ml-1.5">
              <span className="text-[#22c55e] font-bold text-[12px]">ج.م</span>
              <span className="text-gray-400 text-[11px] font-bold">/كجم</span>
            </div>
          </div>
        </div>

        {/* زر "أضف للسلة" العالمي - iOS Style Pill Button */}
        <button
          onClick={handleAdd}
          disabled={!isAvailable}
          className={`relative overflow-hidden flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl text-white font-bold text-[13px] shadow-sm active:scale-95 transition-all duration-300 disabled:opacity-50 ${
            isAdded ? 'bg-green-600' : 'bg-[#22c55e] hover:bg-green-600 hover:shadow-md'
          }`}
        >
          <AnimatePresence mode="wait">
            {isAdded ? (
              <motion.div
                key="added"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <Check size={16} strokeWidth={3} />
                <span>تمت الإضافة</span>
              </motion.div>
            ) : (
              <motion.div
                key="add"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <ShoppingCart size={16} strokeWidth={2.5} />
                <span>أضف للسلة</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}
