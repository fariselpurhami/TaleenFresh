// src/app/error.tsx

'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
   
    console.error(`[System Error Log] Digest: ${error.digest || 'N/A'}`, error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
      
      <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm ring-8 ring-red-50/50 dark:ring-red-950/20">
        <AlertCircle className="w-10 h-10" aria-hidden="true" />
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-3">
        معلش، الشبكة ضعيفة شوية!
      </h2>
      
      <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-8 text-sm md:text-base leading-relaxed">
        حصلت مشكلة صغيرة وإحنا بنجهزلك الخضار والفاكهة الطازة. ما تقلقش، دي مجرد "زغطة" في النت. دوس على الزرار اللي تحت وهنحاول نجيبهم تاني فوراً.
      </p>
      
      <Button 
        onClick={() => reset()}
        size="lg"
        className="gap-2 font-medium shadow-md hover:shadow-lg transition-all active:scale-95"
        aria-label="إعادة المحاولة لتحديث الصفحة"
      >
        <RefreshCcw className="w-4 h-4" />
        حاول تاني
      </Button>
    </div>
  );
}
