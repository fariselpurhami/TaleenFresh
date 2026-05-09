// src/components/customer/Storefront.tsx

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Home, ShoppingBag, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { ProductCard } from '@/components/customer/ProductCard'
import { useCart } from '@/hooks/useCart'
import { FloatingCart } from '@/components/customer/FloatingCart'
import { supabase } from '@/lib/supabase/client'

interface Product {
  id: string
  name_en: string
  name_ar?: string
  category: string
  image_url: string
  price_per_kg: number
  is_available: boolean
}

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: '🥗', color: 'bg-orange-100' },
  { id: 'fruits', name: 'فواكه', icon: '🍇', color: 'bg-red-100' },
  { id: 'leaf_greens', name: 'ورقيات', icon: '🥬', color: 'bg-green-100' },
  { id: 'veggies', name: 'خضروات', icon: '🥕', color: 'bg-emerald-100' },
]

export default function Storefront({ initialProducts }: { initialProducts: Product[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [greeting, setGreeting] = useState('مرحباً')
  const [isMounted, setIsMounted] = useState(false)
  const [liveProducts, setLiveProducts] = useState(initialProducts)
  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()
  const cartControls = useAnimation()

  useEffect(() => {
    setIsMounted(true)
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'صباح الخير ☀️' : 'مساء الخير 🌙')
    setLiveProducts(initialProducts)

    const handleCartBounce = () => {
      cartControls.start({
        scale: [1, 1.2, 0.9, 1.1, 1],
        y: [0, -8, 4, -2, 0],
        transition: { duration: 0.5, ease: 'easeInOut' }
      })
    }

    window.addEventListener('cart-bounce', handleCartBounce)

    const channel = supabase
      .channel('realtime-storefront')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          setLiveProducts((current) =>
            current.map((p) => (p.id === payload.new.id ? { ...p, ...(payload.new as Product) } : p))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('cart-bounce', handleCartBounce)
    }
  }, [initialProducts, cartControls])

  const filteredProducts = useMemo(() => {
    return liveProducts.filter((product) => {
      const query = searchQuery.toLowerCase()
      const nameEn = product.name_en?.toLowerCase() || ''
      const nameAr = product.name_ar?.toLowerCase() || ''
      const matchesSearch = nameEn.includes(query) || nameAr.includes(query)
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [liveProducts, searchQuery, selectedCategory])

  return (
    <div dir="rtl" className="relative min-h-[100dvh] overflow-hidden bg-transparent pb-24">
      <header className="flex items-center justify-between px-6 pb-4 pt-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white p-0.5 shadow-md">
            <img src="/icon-512x512.png" alt="Taleen Fresh Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground">{greeting}</h2>
            <p className="text-xs font-medium text-muted-foreground">ماذا ستشتري اليوم؟</p>
          </div>
        </div>
      </header>

      <div className="mb-4 px-6 py-2">
        <h1 className="mb-1 text-right text-2xl font-black leading-tight text-foreground">
          مُنتجات طازجة تُقطف بعناية<br />لتصلك بأعلى جودة.
        </h1>
        <p className="mt-2 inline-block rounded-lg border border-gray-100 bg-[#2C643E] px-3 py-1.5 text-right text-sm font-medium text-white shadow-sm backdrop-blur-sm">
          ننتقي أفضلَ المنتجاتِ يوميًّا 🍃 | مُتوفِّرون لخدمتكُم داخلَ مدينةِ كفر الشيخ من 8:00 ص حتَّى 10:00 م.
        </p>
      </div>

      <div className="relative z-10 mb-6 mt-2 px-6">
        <div className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-[#2C643E]/50 transition-all focus-within:ring-2">
          <Search className="text-[#2C643E]" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن الخضروات والفواكه..."
            className="flex-1 bg-transparent text-[16px] font-bold text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-center px-6">
          <h3 className="text-lg font-black text-foreground">الأقسام</h3>
        </div>
        <div className="flex justify-center gap-10 pb-2 pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex shrink-0 snap-start flex-col items-center gap-2 outline-none"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-sm transition-colors ${
                  selectedCategory === cat.id ? 'border-[#2C643E] bg-white' : 'border-white ' + cat.color
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
              </motion.div>
              <span
                className={`text-xs font-bold transition-colors ${
                  selectedCategory === cat.id ? 'text-[#2C643E]' : 'text-muted-foreground'
                }`}
              >
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 px-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground">منتجات طازجة</h3>
          <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-[#2C643E]">
            {filteredProducts.length} منتج
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-10 text-center font-bold text-muted-foreground">لا توجد منتجات مطابقة لبحثك</div>
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
                    name={product.name_ar || product.name_en}
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

      <div className="fixed bottom-1 left-0 right-0 z-40 mx-auto w-full max-w-md px-10">
        <div className="flex h-20 items-center justify-between rounded-[2.5rem] border border-gray-100/80 bg-white/90 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md">
          <button className="flex flex-col items-center gap-1 text-[#2C643E]">
            <Home size={24} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>

          <div className="relative -top-6">
            <button className="flex h-16 w-16 rotate-3 transform items-center justify-center rounded-[1.5rem] border-4 border-[#f8f9fa] bg-[#2C643E] text-white shadow-lg shadow-green-500/40 transition-transform hover:rotate-0">
              <ShoppingBag size={28} strokeWidth={2.5} />
            </button>
          </div>

          <motion.button
            onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))}
            className="relative flex flex-col items-center gap-1 text-[#2C643E]"
            animate={cartControls}
          >
            <div className="relative">
              <ShoppingCart size={24} strokeWidth={2.5} className="text-[#2C643E]" />
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
