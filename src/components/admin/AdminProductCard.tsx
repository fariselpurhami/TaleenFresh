// src/components/admin/AdminProductCard.tsx

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, EyeOff } from 'lucide-react';
import { updateProductAction } from '@/app/actions/admin-actions';

export interface Product {
  id: string;
  name_ar?: string;
  name_en?: string;
  price_per_kg: number;
  is_available: boolean;
  image_url?: string;
}

interface AdminProductCardProps {
  product: Product;
}

export function AdminProductCard({ product }: AdminProductCardProps) {
  const router = useRouter();

  const [price, setPrice] = useState<string>(product.price_per_kg.toString());
  const [isAvailable, setIsAvailable] = useState<boolean>(product.is_available);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const displayName = product.name_ar || product.name_en || 'منتج غير معروف';

  const handleUpdate = useCallback(async () => {
    const parsedPrice = parseFloat(price);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('الرجاء إدخال سعر صحيح');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const result = await updateProductAction(product.id, {
        price_per_kg: parsedPrice,
        is_available: isAvailable,
      });

      if (result?.success) {
        router.refresh();
      } else {
        setErrorMsg('فشل في التحديث، راجع الصلاحيات');
      }
    } catch (error) {
      setErrorMsg('حدث خطأ غير متوقع أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  }, [price, isAvailable, product.id, router]);

  const toggleAvailability = useCallback(() => {
    setIsAvailable((prev) => !prev);
  }, []);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
    if (errorMsg) setErrorMsg('');
  }, [errorMsg]);

  return (
    <article
      className={`relative mb-2 flex items-center rounded-[1.75rem] border border-gray-100/50 bg-white/95 p-3 shadow-[0_10px_40px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
        !isAvailable ? 'bg-gray-50/50 grayscale-[0.2]' : ''
      }`}
      dir="rtl"
      aria-label={`تعديل المنتج: ${displayName}`}
    >
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={handleUpdate}
          disabled={isSaving}
          aria-label={isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          className="z-20 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0D0D0D] text-white shadow-lg transition-all active:scale-90 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D0D0D] focus-visible:ring-offset-2"
        >
          {isSaving ? (
            <div
              className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
              role="status"
              aria-label="جاري التحميل"
            />
          ) : (
            <Save size={20} aria-hidden="true" />
          )}
        </button>

        <div className="flex h-12 w-[5.5rem] items-center rounded-2xl border border-transparent bg-gray-100/80 px-2 transition-all duration-300 focus-within:border-[#22c55e] focus-within:bg-white">
          <span className="ml-1 text-[10px] font-black text-gray-400" aria-hidden="true">
            ج.م
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={price}
            onChange={handlePriceChange}
            aria-label="السعر لكل كيلوجرام"
            aria-invalid={!!errorMsg}
            className="w-full bg-transparent text-center text-[16px] font-black text-gray-900 outline-none"
          />
        </div>

        <button
          onClick={toggleAvailability}
          aria-label={isAvailable ? 'إخفاء المنتج' : 'إظهار المنتج'}
          aria-pressed={isAvailable}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isAvailable
              ? 'bg-green-50 text-[#22c55e] focus-visible:ring-[#22c55e]'
              : 'bg-red-50 text-red-400 focus-visible:ring-red-400'
          }`}
        >
          {isAvailable ? (
            <Eye size={22} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <EyeOff size={22} strokeWidth={2.5} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-start justify-center overflow-hidden pl-2 pr-4">
        <h3
          className="mb-1 w-full truncate text-right text-sm font-black leading-tight text-gray-900 md:text-base"
          title={displayName}
        >
          {displayName}
        </h3>

        {errorMsg && (
          <p className="text-[10px] font-bold text-red-500" role="alert">
            {errorMsg}
          </p>
        )}
      </div>

      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] border border-gray-100/50 bg-gradient-to-br from-gray-50 to-white p-1.5 shadow-inner">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={displayName}
            className="h-full w-full object-contain drop-shadow-sm"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full rounded-lg bg-gray-200/50" aria-hidden="true" />
        )}

        {!isAvailable && (
          <div
            className="absolute inset-0 rounded-[1.25rem] bg-white/60 backdrop-blur-[1px]"
            aria-hidden="true"
          />
        )}
      </div>
    </article>
  );
}
