// src/components/admin/AdminProductCard.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Save, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateProductAction } from '@/app/actions/admin-actions';

export function AdminProductCard({ product }: { product: any }) {
  const router = useRouter();
  const [price, setPrice] = useState(product.price_per_kg.toString());
  const [isAvailable, setIsAvailable] = useState(product.is_available);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async () => {
    setIsSaving(true);
    
    const result = await updateProductAction(product.id, {
        price_per_kg: parseFloat(price),
        is_available: isAvailable
    });

    if (result.success) {
        router.refresh();
    } else {
        alert('فشل في التحديث، راجع الصلاحيات!');
    }
    
    setIsSaving(false);
};

  return (
    <div className={`relative flex items-center bg-white/95 backdrop-blur-xl rounded-[1.75rem] p-3 shadow-[0_10px_40px_rgb(0,0,0,0.04)] border border-gray-100/50 mb-2 transition-all duration-500 ${!isAvailable && 'bg-gray-50/50 grayscale-[0.2]'}`} dir="rtl">

      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={handleUpdate}
          disabled={isSaving}
          className="h-12 w-12 shrink-0 bg-[#0D0D0D] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50 z-20"
        >
          {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
        </button>

        <div className="bg-gray-100/80 rounded-2xl px-2 h-12 flex items-center border border-transparent focus-within:border-[#22c55e] focus-within:bg-white w-[5.5rem] transition-all duration-300">
          <span className="text-[10px] font-black text-gray-400 ml-1">ج.م</span>
          <input 
            type="number" 
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-transparent font-black text-[16px] text-center outline-none text-gray-900" 
          />
        </div>

        <button 
          onClick={() => setIsAvailable(!isAvailable)}
          className={`h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl transition-all duration-300 ${isAvailable ? 'bg-green-50 text-[#22c55e]' : 'bg-red-50 text-red-400'}`}
        >
          {isAvailable ? <Eye size={22} strokeWidth={2.5} /> : <EyeOff size={22} strokeWidth={2.5} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-start justify-center pr-4 pl-2 overflow-hidden">
        <h3 className="font-black text-gray-900 text-sm md:text-base mb-1 truncate w-full text-right leading-tight">
          {product.name_ar || product.name_en}
        </h3>
      </div>

      <div className="relative w-14 h-14 bg-gradient-to-br from-gray-50 to-white rounded-[1.25rem] p-1.5 shrink-0 shadow-inner flex items-center justify-center border border-gray-100/50">
        <img src={product.image_url} alt="" className="w-full h-full object-contain drop-shadow-sm" />
        {!isAvailable && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-[1.25rem]" />}
      </div>

    </div>
  );
}
