import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Kufi_Arabic } from 'next/font/google';
import { cn } from '@/lib/utils';
import '@/app/globals.css'; 

const notoKufi = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-kufi',
  display: 'swap',
  preload: false,
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

// 1. التعديل الأول: تفعيل التغطية الكاملة لاحترام النوتش والمنطقة الآمنة
export const viewport: Viewport = {
  themeColor: '#f8f9fa',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'TaleenFresh | تالين فريش',
  description: "Nature's best produce, straight to your door.",
};

export default function CustomerLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-arabic text-foreground antialiased', notoKufi.variable, inter.variable)} suppressHydrationWarning>
        
        {/* 2. التعديل الثاني: الدرع الزجاجي لحماية منطقة البطارية والساعة */}
        <div className="fixed top-0 left-0 right-0 z-[100] h-[max(env(safe-area-inset-top),1.25rem)] bg-[#f8f9fa]/85 backdrop-blur-md pointer-events-none" />

        <main className="relative flex min-h-screen flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
