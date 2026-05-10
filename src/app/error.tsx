// src/app/error.tsx

'use client';

import * as React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(`[ErrorBoundary] Digest: ${error.digest ?? 'N/A'}`, error);
  }, [error]);

  return (
    <main
      role="alert"
      aria-live="assertive"
      className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
        <AlertCircle className="size-10" aria-hidden="true" />
      </div>

      <h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
        معلش، الشبكة ضعيفة شوية!
      </h1>

      <p className="mb-8 max-w-md text-balance text-sm leading-relaxed text-muted-foreground md:text-base">
        حصلت مشكلة صغيرة وإحنا بنجهزلك الخضار والفاكهة الطازة. ما تقلقش، دي مجرد "زغطة" في النت. دوس على الزرار اللي تحت وهنحاول نجيبهم تاني فوراً.
      </p>

      <Button
        onClick={() => reset()}
        size="lg"
        className="w-full sm:w-auto"
        aria-label="إعادة المحاولة لتحديث الصفحة"
      >
        <RefreshCcw className="size-4" aria-hidden="true" />
        حاول تاني
      </Button>
    </main>
  );
}
