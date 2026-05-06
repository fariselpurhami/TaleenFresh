// src/app/(admin)/admin/page.tsx

'use client'; 

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import OrdersClient from '@/components/admin/OrdersClient';
import { AdminProductCard } from '@/components/admin/AdminProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShoppingCart } from 'lucide-react';

export default function AdminDashboardPage() {
 const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
 const [products, setProducts] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   async function fetchData() {
    
     const { data: p } = await supabase.from('products').select('*').order('name_en');
     setProducts(p || []);
     setLoading(false);
   }
   fetchData();
 }, []);

 if (loading) return <div className="flex h-screen items-center justify-center font-black text-gray-400" dir="rtl">جاري تحميل غرفة العمليات...</div>;

 return (
   <div className="w-full max-w-4xl mx-auto flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] px-[calc(1rem+env(safe-area-inset-left))]" dir="rtl">
    
     <header className="sticky top-0 z-50 bg-gray-50 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 flex flex-col gap-4 w-full">
       <h1 className="text-3xl font-black text-gray-900 px-2">غرفة العمليات</h1>
      
       <div className="bg-gray-200/60 p-1.5 rounded-2xl flex gap-1 w-full">
         <button
           onClick={() => setActiveTab('orders')}
           className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all ${activeTab === 'orders' ? 'bg-white text-[#2C643E] shadow-sm' : 'text-gray-500 hover:bg-gray-300/50'}`}
         >
           <ShoppingCart size={20} />
           الطلبات الحية
         </button>
         <button
           onClick={() => setActiveTab('inventory')}
           className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all ${activeTab === 'inventory' ? 'bg-white text-[#2C643E] shadow-sm' : 'text-gray-500 hover:bg-gray-300/50'}`}
         >
           <Package size={20} />
           إدارة المخزون
         </button>
       </div>
     </header>

     <main className="w-full pt-2">
       <AnimatePresence mode="wait">
         {activeTab === 'orders' ? (
           <motion.section
             key="orders"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.2 }}
             className="w-full"
           >
             <OrdersClient />
           </motion.section>
         ) : (
           <motion.section
             key="inventory"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.2 }}
             className="w-full grid grid-cols-1 md:grid-cols-2 gap-4"
           >
             {products.map((product) => (
               <AdminProductCard key={product.id} product={product} />
             ))}
           </motion.section>
         )}
       </AnimatePresence>
     </main>
   </div>
 );
}
