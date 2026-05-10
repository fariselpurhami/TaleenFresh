//  src/app/(auth)/layout.tsx

import React from 'react';
import type { Metadata } from 'next';
import { Noto_Kufi_Arabic } from 'next/font/google';
import '@/app/globals.css';

const notoKufi = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-kufi',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'تسجيل الدخول | النظام',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface AuthLayoutProps {
  readonly children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`flex min-h-screen items-center justify-center bg-gray-50 font-arabic antialiased ${notoKufi.variable}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
