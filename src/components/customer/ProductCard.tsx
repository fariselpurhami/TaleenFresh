// src/components/customer/ProductCard.tsx

'use client'

import React, { memo, useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

interface ProductCardProps {
  readonly id: string
  readonly name: string
  readonly price: number
  readonly imageUrl: string
  readonly isAvailable: boolean
  readonly category: string
  readonly priority?: boolean
}

interface CartProductInput {
  readonly id: string
  readonly name: string
  readonly price: number
  readonly category: string
}

const ADD_FEEDBACK_DURATION_MS = 800

const getUnitLabel = (name: string, category: string): string => {
  const isGrapeLeaves = name.includes('عنب')
  return category === 'leaf_greens' && !isGrapeLeaves ? 'حزمة' : 'كجم'
}

const formatPrice = (price?: number): string =>
  typeof price === 'number' && Number.isFinite(price) ? price.toFixed(2) : '0.00';

export const ProductCard = memo(function ProductCard({
  id,
  name,
  price,
  imageUrl,
  isAvailable,
  category,
  priority = false,
}: ProductCardProps) {
  const addItem = useCart((state) => state.addItem)
  const [isAdded, setIsAdded] = useState(false)
  const resetAddedStateTimeoutRef = useRef<number | null>(null)

  const unit = useMemo(() => getUnitLabel(name, category), [category, name])
  const formattedPrice = useMemo(() => formatPrice(price), [price])

  const clearResetTimer = useCallback(() => {
    if (resetAddedStateTimeoutRef.current !== null) {
      window.clearTimeout(resetAddedStateTimeoutRef.current)
      resetAddedStateTimeoutRef.current = null
    }
  }, [])

  const handleAdd = useCallback(() => {
  if (!isAvailable) return;

  const product: CartProductInput = {
    id,
    name,
    price,
    category,
  };

  setIsAdded(true);
  clearResetTimer();

  startTransition(() => {
    addItem(product);
  });

  requestAnimationFrame(() => {
    window.dispatchEvent(
      new CustomEvent('cart:bounce', { 
        bubbles: true, 
        composed: true 
      })
    );
  });

  resetAddedStateTimeoutRef.current = window.setTimeout(() => {
    setIsAdded(false);
    resetAddedStateTimeoutRef.current = null;
  }, ADD_FEEDBACK_DURATION_MS);
}, [isAvailable, id, name, price, category, clearResetTimer, addItem]);

  useEffect(() => {
    return () => {
      clearResetTimer()
    }
  }, [clearResetTimer])

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.97 }}
      className={`relative flex h-[280px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-gray-100/50 bg-white p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_30px_rgb(34,197,94,0.12)] ${
        !isAvailable ? 'opacity-50 grayscale' : ''
      }`}
    >
      <div className="absolute left-0 top-0 z-10 rounded-br-[1.2rem] rounded-tl-[1.5rem] bg-gradient-to-br from-[#2C643E] to-green-600 px-3.5 py-1.5 text-[11px] font-black tracking-wide text-white shadow-sm">
        10% خصم
      </div>

      <div className="relative mb-3 mt-4 flex h-36 w-full items-center justify-center bg-transparent">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-contain transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
          priority={priority}
          quality={75}
          loading={priority ? 'eager' : 'lazy'}
        />

	{!isAvailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
	    <div className="flex items-center justify-center border border-white/10 bg-gray-900/75 px-3.5 py-1.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md">
              <span className="text-[15px] font-black tracking-widest text-white drop-shadow-md">
                غير متوفر
              </span>
            </div>
	  </div>
        )}
      </div>

      <div className="mt-auto flex w-full flex-col gap-2">
        <h3 className="line-clamp-1 w-full text-right text-[15px] font-bold text-gray-800">
          {name}
        </h3>

        <div className="flex w-full min-w-0 flex-col items-start">
          <div className="flex w-full flex-nowrap items-baseline truncate text-right">
            <span className="shrink-1 text-[17px] font-black tracking-tight text-[#2C643E]">
              {formattedPrice}
            </span>
            <div className="ml-1.5 flex shrink-0 items-baseline gap-0.5">
              <span className="text-[12px] font-bold text-[#2C643E]">ج.م</span>
              <span className="text-[11px] font-bold text-gray-700">/{unit}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          data-testid="add-to-cart-button"
          onClick={handleAdd}
          disabled={!isAvailable}
          aria-label={isAvailable ? `أضف ${name} إلى السلة` : `${name} غير متاح حالياً`}
          className={`relative flex h-10 w-full shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl text-[13px] font-bold text-white shadow-sm transition-all duration-300 disabled:opacity-50 active:scale-95 ${
            isAdded ? 'bg-green-600' : 'bg-[#2C643E] hover:bg-green-600 hover:shadow-md'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isAdded ? (
              <motion.div
                key="added"
                data-testid="added-to-cart-icon"
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
  )
})
