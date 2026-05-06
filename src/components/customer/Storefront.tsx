// src/components/customer/Storefront.tsx

'use client';

import { useState, useEffect } from 'react';
import { Search, Home, ShoppingBag, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ProductCard } from '@/components/customer/ProductCard';
import { useCart } from '@/hooks/useCart';
import { FloatingCart } from '@/components/customer/FloatingCart';
import { supabase } from '@/lib/supabase/client';

interface Product {
  id: string;
  name_en: string;
  name_ar?: string;
  category: string;
  image_url: string;
  price_per_kg: number;
  is_available: boolean;
}

export default function Storefront({ initialProducts }: { initialProducts: Product[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [greeting, setGreeting] = useState('مرحباً');
  const [isMounted, setIsMounted] = useState(false);
  const [liveProducts, setLiveProducts] = useState(initialProducts);
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  
  const cartControls = useAnimation();

  useEffect(() => {
    setIsMounted(true);
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'صباح الخير ☀️' : 'مساء الخير 🌙');
    setLiveProducts(initialProducts);

    const handleCartBounce = () => {
      cartControls.start({
        scale: [1, 1.2, 0.9, 1.1, 1],
        y: [0, -8, 4, -2, 0], 
        transition: { duration: 0.5, ease: "easeInOut" }
      });
    };
    window.addEventListener('cart-bounce', handleCartBounce);

    const channel = supabase
      .channel('realtime-storefront')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          setLiveProducts((currentProducts) =>
            currentProducts.map((p) =>
              p.id === payload.new.id ? { ...p, ...(payload.new as Product) } : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('cart-bounce', handleCartBounce);
    };
  }, [initialProducts, cartControls]);

  const filteredProducts = liveProducts.filter((product) => {
    const query = searchQuery.toLowerCase();
    const nameEn = product.name_en?.toLowerCase() || '';
    const nameAr = product.name_ar?.toLowerCase() || '';
    const matchesSearch = nameEn.includes(query) || nameAr.includes(query);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'الكل', icon: '🥗', color: 'bg-orange-100' },
    { id: 'fruits', name: 'فواكه', icon: '🍇', color: 'bg-red-100' },
    { id: 'veggies', name: 'خضروات', icon: '🥕', color: 'bg-emerald-100' },
  ];

  return (
    <div dir="rtl" className="relative min-h-[100dvh] bg-transparent pb-24 overflow-hidden">

      <header className="flex items-center justify-between px-6 pt-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center p-0.5">
            <img src="/icon-512x512.png" alt="Taleen Fresh Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground">{greeting}</h2>
            <p className="text-xs text-muted-foreground font-medium">ماذا ستشتري اليوم؟</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-2 mb-4">
        <h1 className="text-2xl font-black leading-tight text-foreground mb-1 text-right">
          مُنتجات طازجة تُقطف بعناية<br />لتصلك بأعلى جودة.
        </h1>
      
        <p className="text-sm text-muted-foreground mt-2 font-medium text-right bg-white/50 inline-block px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm backdrop-blur-sm">
          ننتقي أفضلَ المنتجاتِ يوميًّا 🍃 | مُتوفِّرون لخدمتكُم داخلَ مدينةِ كفر الشيخ من 8:00 ص حتَّى 10:00 م.
        </p>
      </div>

      <div className="px-6 mt-2 mb-6 relative z-10">
        <div className="flex items-center gap-3 w-full rounded-2xl bg-white px-4 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-within:ring-2 ring-[#2C643E]/50 transition-all">
          <Search className="text-[#2C643E]" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن الخضروات والفواكه..."
            className="flex-1 bg-transparent text-[16px] font-bold text-foreground outline-none placeholder:text-muted-foreground/50 placeholder:font-medium"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between px-6 mb-4">
          <h3 className="text-lg font-black text-foreground">الأقسام</h3>
        </div>
        <div className="flex justify-center gap-10 pb-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex flex-col items-center gap-2 snap-start flex-shrink-0 outline-none"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex h-16 w-16 items-center justify-center rounded-full shadow-sm border-2 transition-colors ${
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

      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-foreground">منتجات طازجة</h3>
          <span className="text-xs font-bold text-[#2C643E] bg-green-100 px-2 py-1 rounded-md">
            {filteredProducts.length} منتج
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground font-bold">لا توجد منتجات مطابقة لبحثك</div>
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
                    priority={index < 4}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="fixed bottom-1 left-0 right-0 z-40 mx-auto px-10 w-full max-w-md">
        <div className="flex h-20 items-center justify-between rounded-[2.5rem] bg-white px-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/80 backdrop-blur-md bg-white/90">
          <button className="flex flex-col items-center gap-1 text-[#2C643E]">
            <Home size={24} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>

          <div className="relative -top-6">
            <button className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#2C643E] text-white shadow-lg shadow-green-500/40 border-4 border-[#f8f9fa] transform rotate-3 hover:rotate-0 transition-transform">
              <ShoppingBag size={28} strokeWidth={2.5} />
            </button>
          </div>

          <motion.button
            onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))}
            className="flex flex-col items-center gap-1 text-[#2C643E] relative"
            animate={cartControls} 
          >
            <div className="relative">
              <ShoppingCart size={24} strokeWidth={2.5} className="text-[#2C643E]" />
              {isMounted && totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-2 flex min-w-[16px] h-4 px-1 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-sm ring-2 ring-white whitespace-nowrap"
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
  );
}
