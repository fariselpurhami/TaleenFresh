// src/components/admin/AdminPriceGrid.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch'; // shadcn

interface AdminProduct {
  id: string;
  name_en: string;
  price_per_kg: number;
  is_available: boolean;
}

export function AdminPriceGrid({ initialData }: { initialData: AdminProduct[] }) {
  const [products, setProducts] = useState<AdminProduct[]>(initialData);

  useEffect(() => {
    // Establish Realtime Subscription
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
    // Optimistic UI update for the admin
    setProducts((current) =>
      current.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    // Persist to DB
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) console.error("Update failed:", error);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 font-semibold text-gray-600 text-sm">
        <div className="col-span-5">Product</div>
        <div className="col-span-4">Today's Price (LE)</div>
        <div className="col-span-3 text-right">Available</div>
      </div>
      
      <div className="divide-y divide-gray-50">
        {products.map((product) => (
          <div key={product.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50/50 transition-colors">
            <div className="col-span-5 font-medium text-gray-900">
              {product.name_en}
            </div>
            <div className="col-span-4">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm">LE</span>
                <input
                  type="number"
                  step="0.5"
                  value={product.price_per_kg}
                  onChange={(e) => updateProduct(product.id, { price_per_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                />
              </div>
            </div>
            <div className="col-span-3 flex justify-end">
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
