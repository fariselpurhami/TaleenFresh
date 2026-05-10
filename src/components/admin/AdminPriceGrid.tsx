// src/components/admin/AdminPriceGrid.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';

export interface AdminProduct {
  id: string;
  name_en: string;
  price_per_kg: number;
  is_available: boolean;
}

interface AdminPriceGridProps {
  initialData: AdminProduct[];
}

export function AdminPriceGrid({ initialData }: AdminPriceGridProps) {
  const [products, setProducts] = useState<AdminProduct[]>(initialData);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('admin_product_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const updatedProduct = payload.new as Partial<AdminProduct>;
          setProducts((current) =>
            current.map((p) =>
              p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateProduct = useCallback(
    async (id: string, updates: Partial<AdminProduct>) => {
      const previousState = [...products];
      setSyncError(null);

      setProducts((current) =>
        current.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );

      try {
        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        setProducts(previousState);
        setSyncError('فشل تحديث قاعدة البيانات. تم التراجع عن التعديل.');

        const timer = setTimeout(() => setSyncError(null), 4000);
        return () => clearTimeout(timer);
      }
    },
    [products]
  );

  return (
    <section className="relative w-full" aria-label="إدارة أسعار المنتجات">
      {syncError && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-100 px-4 py-3 text-sm font-bold text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{syncError}</p>
        </div>
      )}

      <div
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        role="grid"
      >
        <div
          className="grid grid-cols-[2fr_1fr_1fr] gap-4 border-b border-gray-200 bg-gray-50 p-4 text-sm font-bold text-gray-500"
          role="row"
        >
          <div role="columnheader">Product</div>
          <div role="columnheader" className="text-center">Today&apos;s Price (LE)</div>
          <div role="columnheader" className="text-center">Available</div>
        </div>

        <div className="divide-y divide-gray-100" role="rowgroup">
          {products.map((product) => (
            <div
              key={product.id}
              role="row"
              className="grid grid-cols-[2fr_1fr_1fr] items-center gap-4 p-4 transition-colors hover:bg-gray-50/50"
            >
              <div role="cell" className="font-bold text-gray-900 truncate">
                {product.name_en}
              </div>

              <div role="cell" className="relative px-2 sm:px-4">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 sm:left-6"
                  aria-hidden="true"
                >
                  LE
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product.price_per_kg}
                  aria-label={`Price for ${product.name_en}`}
                  onBlur={(e) => {
                    const newValue = parseFloat(e.target.value);
                    if (!isNaN(newValue) && newValue !== product.price_per_kg) {
                      updateProduct(product.id, { price_per_kg: newValue });
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 font-mono font-bold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                />
              </div>

              <div role="cell" className="flex justify-center">
                <Switch
                  checked={product.is_available}
                  onCheckedChange={(checked) =>
                    updateProduct(product.id, { is_available: checked })
                  }
                  aria-label={`Toggle availability for ${product.name_en}`}
                />
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="p-8 text-center text-sm font-medium text-gray-500" role="row">
              <div role="cell">No products available.</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
