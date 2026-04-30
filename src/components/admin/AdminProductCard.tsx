// src/components/admin/AdminProductCard.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Save, AlertCircle, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AdminProductCard({ product }: { product: any }) {
  const router = useRouter();
  const [price, setPrice] = useState(product.price_per_kg.toString());
  const [isAvailable, setIsAvailable] = useState(product.is_available);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleUpdate = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('products')
      .update({ 
        price_per_kg: parseFloat(price), 
        is_available: isAvailable 
      })
      .eq('id', product.id);

    if (error) {
      console.error('Update Error:', error);
      alert('فشل التحديث: تأكد من صلاحيات قاعدة البيانات');
      setIsSaving(false);
    } else {
      setIsSaving(false);
      setSaved(true);
      router.refresh(); // 👈 ده اللي بيخلي السعر يتغير فوراً في كل حتة
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={product.image_url} alt="" className="w-14 h-14 object-contain bg-gray-50 rounded-2xl" />
          <div>
            <h3 className="font-black text-gray-900">{product.name_ar || product.name_en}</h3>
            <p className="text-xs font-bold text-gray-400 italic">ID: {product.id.slice(0, 8)}</p>
          </div>
        </div>
        
        {/* Toggle Availability Switch */}
        <button 
          onClick={() => {
            setIsAvailable(!isAvailable);
            // تحديث لحظي للتوافر بمجرد الضغط
          }}
          className={`w-14 h-8 rounded-full p-1 transition-colors ${isAvailable ? 'bg-[#22c55e]' : 'bg-gray-200'}`}
        >
          <motion.div 
            animate={{ x: isAvailable ? 0 : -24 }}
            className="w-6 h-6 bg-white rounded-full shadow-sm"
          />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-50 rounded-2xl p-1 flex items-center px-4 border border-gray-100">
          <span className="text-xs font-black text-gray-400 ml-2">ج.م</span>
          <input 
            type="number" 
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-transparent py-3 font-black text-lg text-right outline-none"
          />
        </div>
        
        <button 
          onClick={handleUpdate}
          disabled={isSaving}
          className="h-14 w-14 bg-[#0D0D0D] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
        </button>
      </div>
      
      {!isAvailable && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-xl justify-center">
          <AlertCircle size={14} />
          <span className="text-[10px] font-black uppercase">المنتج مخفي حالياً عن الزبائن</span>
        </div>
      )}
    </div>
  );
}
