// src/components/customer/ProductCard.tsx

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

interface ProductCardProps {
  id: string
  name: string
  price: number
  imageUrl: string
  isAvailable: boolean
  category: string
  priority?: boolean
}

export const ProductCard = React.memo(function ProductCard({
  id,
  name,
  price,
  imageUrl,
  isAvailable,
  category,
  priority = false
}: ProductCardProps) {
  const addItem = useCart((state) => state.addItem)
  const [isAdded, setIsAdded] = useState(false)

  const isGrapeLeaves = name.includes('عنب')
  const unit = category === 'leaf_greens' && !isGrapeLeaves ? 'حزمة' : 'كجم'

  const handleAdd = () => {
    if (!isAvailable) return
    window.dispatchEvent(new CustomEvent('cart-bounce'))
    addItem({ id, name, price, category } as any)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 800)
  }

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
      </div>

      <div className="mt-auto flex w-full flex-col gap-2">
        <h3 className="line-clamp-1 w-full text-right text-[15px] font-bold text-gray-800">
          {name}
        </h3>

        <div className="flex w-full min-w-0 flex-col items-start">
          <div className="flex w-full flex-nowrap items-baseline truncate text-right">
            <span className="shrink-1 text-[17px] font-black tracking-tight text-[#2C643E]">
              {price.toFixed(2)}
            </span>
            <div className="ml-1.5 flex shrink-0 items-baseline gap-0.5">
              <span className="text-[12px] font-bold text-[#2C643E]">ج.م</span>
              <span className="text-[11px] font-bold text-gray-400">/{unit}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!isAvailable}
          className={`relative flex h-10 w-full shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl text-[13px] font-bold text-white shadow-sm transition-all duration-300 disabled:opacity-50 active:scale-95 ${
            isAdded ? 'bg-green-600' : 'bg-[#2C643E] hover:bg-green-600 hover:shadow-md'
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
  )
})
