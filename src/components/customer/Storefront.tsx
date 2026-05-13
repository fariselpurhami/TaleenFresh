// src/components/customer/Storefront.tsx

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Home, ShoppingBag, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { ProductCard } from '@/components/customer/ProductCard'
import { useCart, selectTotalItems } from '@/hooks/useCart'
import { FloatingCart } from '@/components/customer/FloatingCart'
import { supabase } from '@/lib/supabase/client'

export interface Product {
  readonly id: string
  readonly name_en: string
  readonly name_ar?: string
  readonly category: string
  readonly image_url: string
  readonly price_per_kg: number
  readonly is_available: boolean
}

interface CategoryConfig {
  readonly id: string
  readonly name: string
  readonly icon: string
  readonly color: string
}

interface StorefrontProps {
  readonly initialProducts: readonly Product[]
}

const CATEGORIES: readonly CategoryConfig[] = [
  { id: 'all', name: 'الكل', icon: '🥗', color: 'bg-orange-100' },
  { id: 'veggies', name: 'خضروات', icon: '🫜', color: 'bg-emerald-100' },
  { id: 'fruits', name: 'فواكه', icon: '🍒', color: 'bg-red-100' },
  { id: 'leaf_greens', name: 'ورقيات', icon: '☘️', color: 'bg-green-100' },
]

const getGreeting = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'صباح الخير ☀️'
  if (hour >= 12 && hour < 18) return 'مساء الخير 🌤️'
  return 'مساء الخير 🌙'
}

export default function Storefront({ initialProducts }: StorefrontProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [greeting, setGreeting] = useState('مرحباً')
  const [isMounted, setIsMounted] = useState(false)
  const [liveProducts, setLiveProducts] = useState<readonly Product[]>(initialProducts)

  const totalItems = useCart(selectTotalItems)
  const cartControls = useAnimation()

  const handleCartBounce = useCallback(() => {
    void cartControls.start({
      scale: [1, 1.2, 0.9, 1.1, 1],
      y: [0, -8, 4, -2, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    })
  }, [cartControls])

  useEffect(() => {
    setIsMounted(true)
    setGreeting(getGreeting(new Date().getHours()))
    setLiveProducts(initialProducts)

    const handleCustomEvent = () => handleCartBounce()
    window.addEventListener('cart-bounce', handleCustomEvent)

    const channel = supabase
      .channel('realtime-storefront')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          setLiveProducts((current) =>
            current.map((p) =>
              p.id === payload.new.id ? { ...p, ...(payload.new as Product) } : p
            )
          )
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener('cart-bounce', handleCustomEvent)
      void supabase.removeChannel(channel)
    }
  }, [initialProducts, handleCartBounce])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return liveProducts.filter((product) => {
      const nameEn = product.name_en?.toLowerCase() ?? ''
      const nameAr = product.name_ar?.toLowerCase() ?? ''

      const matchesSearch =
        normalizedQuery === '' ||
        nameEn.includes(normalizedQuery) ||
        nameAr.includes(normalizedQuery)

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [liveProducts, searchQuery, selectedCategory])

  const handleOpenCartClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-cart'))
  }, [])

  return (
    <div dir="rtl" className="relative min-h-[100dvh] overflow-hidden bg-transparent pb-24">
      <header className="flex items-center justify-between px-6 pb-1 pt-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white p-0.5 shadow-md">
            <img
              src="/icon-512x512.png"
              alt="TaleenFresh Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground">{greeting}</h2>
            <p className="text-xs font-medium text-foreground">ماذا ستشتري اليوم؟</p>
          </div>
        </div>
      </header>

      <div className="mb-4 px-6 py-2">
        <h1 className="mb-1 text-right text-2xl font-black leading-tight text-foreground">
          مُنتجات طازجة تُقطف بعناية
          <br />
          لتصلك بأعلى جودة.
        </h1>
        <p className="mt-2 inline-block rounded-lg border border-gray-100 bg-[#2C643E] px-3 py-1.5 text-right text-sm font-medium text-white shadow-sm backdrop-blur-sm">
          ننتقي أفضلَ المنتجاتِ يوميًّا 🍃 | مُتوفِّرون لخدمتكُم داخلَ مدينةِ كفر الشيخ من 8:00 ص حتَّى 10:00 م.
        </p>
      </div>

      <div className="relative z-10 mb-6 mt-2 px-6">
        <div className="flex w-full items-center gap-3 rounded-2xl bg-gray-100 px-4 py-4 transition-all focus-within:bg-white focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#2C643E]/50">
          <Search className="text-[#2C643E]" size={20} aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ابحث عن الخضروات والفواكه..."
            className="flex-1 bg-transparent text-[16px] font-bold text-gray-800 outline-none placeholder:font-medium placeholder:text-gray-400"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            suppressHydrationWarning
            aria-label="ابحث عن المنتجات"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-center px-6">
          <h3 className="text-lg font-black text-foreground">الأقسام</h3>
        </div>
        <div className="flex justify-center gap-4 pb-2 pt-1">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className="flex shrink-0 snap-start flex-col items-center gap-2 outline-none"
              aria-pressed={selectedCategory === category.id}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'border-[#2C643E] bg-white'
                    : `border-white ${category.color}`
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {category.icon}
                </span>
              </motion.div>
              <span
                className={`whitespace-nowrap text-xs font-bold transition-colors ${
                  selectedCategory === category.id ? 'text-[#2C643E]' : 'text-muted-foreground'
                }`}
              >
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 px-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground">منتجات طازجة</h3>
          <span className="rounded-full bg-[#4B4B4B] px-2 py-1 text-xs font-bold text-white">
            {filteredProducts.length} منتج
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-10 text-center font-bold text-muted-foreground">
            لا توجد منتجات مطابقة لبحثك
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={`${product.id}-${product.price_per_kg}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard
                    id={product.id}
                    name={product.name_ar ?? product.name_en ?? ''}
                    price={product.price_per_kg}
                    imageUrl={product.image_url}
                    isAvailable={product.is_available}
                    category={product.category}
                    priority={index < 4}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-md px-10">
        <div className="flex h-20 items-center justify-between rounded-[2.5rem] border border-gray-100/80 bg-white/90 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md">
          <button type="button" className="flex flex-col items-center gap-1 text-[#2C643E]">
            <Home size={24} strokeWidth={2.5} aria-hidden="true" />
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>

          <div className="relative -top-6">
            <button
              type="button"
              className="flex h-16 w-16 rotate-3 transform items-center justify-center rounded-[1.5rem] border-4 border-[#f8f9fa] bg-[#2C643E] text-white shadow-lg shadow-green-500/40 transition-transform hover:rotate-0"
              aria-label="تصفح العروض الخاصة"
            >
              <ShoppingBag size={28} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>

          <motion.button
            type="button"
            onClick={handleOpenCartClick}
            className="relative flex flex-col items-center gap-1 text-[#2C643E]"
            animate={cartControls}
            aria-label={`عرض سلة المشتريات، تحتوي على ${totalItems} منتجات`}
          >
            <div className="relative">
              <ShoppingCart size={24} strokeWidth={2.5} className="text-[#2C643E]" aria-hidden="true" />
              {isMounted && totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center whitespace-nowrap rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white"
                >
                  {totalItems}
                </motion.span>
              )}
            </div>
            <span className="text-[10px] font-bold text-[#2C643E]">السلة</span>
          </motion.button>
        </div>
      </div>
      <FloatingCart />
    </div>
  )
}
