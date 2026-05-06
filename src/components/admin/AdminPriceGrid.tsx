// src/components/admin/AdminPriceGrid.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';

interface AdminProduct {
  id: string;
  name_en: string;
  price_per_kg: number;
  is_available: boolean;
}

export function AdminPriceGrid({ initialData }: { initialData: AdminProduct[] }) {
  const [products, setProducts] = useState(initialData);
  const [syncError, setSyncError] = useState<string | null>(null); 

  useEffect(() => {
    const channel = supabase
      .channel('admin_product_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        setProducts((current) =>
          current.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateProduct = async (id: string, updates: Partial<AdminProduct>) => {
   
    const previousState = [...products];
    setSyncError(null);

    setProducts((current) =>
      current.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error("Update failed:", error);
      setProducts(previousState); 
      setSyncError("فشل تحديث قاعدة البيانات. تم التراجع عن التعديل.");
      setTimeout(() => setSyncError(null), 4000);
    }
  };

  return (
    <div className="w-full relative">
      {syncError && (
        <div className="mb-4 bg-red-100 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 font-bold text-sm shadow-sm border border-red-200 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {syncError}
        </div>
      )}

      <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 p-4 font-bold text-gray-500 bg-gray-50 rounded-t-xl border-b">
        <div>Product</div>
        <div className="text-center">Today's Price (LE)</div>
        <div className="text-center">Available</div>
      </div>
      
      <div className="divide-y border border-t-0 rounded-b-xl">
        {products.map((product) => (
          <div key={product.id} className="grid grid-cols-[2fr_1fr_1fr] gap-4 p-4 items-center hover:bg-gray-50/50 transition-colors">
            <div className="font-bold text-gray-900">{product.name_en}</div>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">LE</span>
              <input
                type="number"
                defaultValue={product.price_per_kg}
                onBlur={(e) => updateProduct(product.id, { price_per_kg: parseFloat(e.target.value) || 0 })}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all font-mono font-bold"
              />
            </div>
            
            <div className="flex justify-center">
              <Switch
                checked={product.is_available}
                onCheckedChange={(checked) => updateProduct(product.id, { is_available: checked })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
