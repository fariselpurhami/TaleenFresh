// src/app/(customer)/layout.tsx 

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
      <body className={cn(
        'min-h-screen font-arabic text-foreground antialiased w-full',
        'bg-background lg:bg-gray-900 lg:flex lg:items-center lg:justify-center',
        notoKufi.variable, 
        inter.variable
      )} suppressHydrationWarning>
        
        <main className={cn(
          'relative flex min-h-screen flex-col w-full bg-background',
          'lg:min-h-[90vh] lg:h-[90vh] lg:max-w-[430px] lg:rounded-[2.5rem] lg:shadow-[0_20px_50px_rgba(0,0,0,0.5)] lg:border-[8px] lg:border-gray-800 lg:overflow-y-auto lg:overflow-x-hidden',
          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
        )}>
          
          <div 
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage: "url('/pattern.jpg')",
              backgroundRepeat: "repeat",
              backgroundSize: "400px",
	      backgroundPosition: "0 0",
              opacity: 0.19
            }}
          />

          <div className="fixed top-0 left-0 w-full z-[100] h-[max(env(safe-area-inset-top),1.25rem)] bg-[#f8f9fa]/85 backdrop-blur-md pointer-events-none md:hidden" />

          <div className="relative z-10 flex flex-col flex-1 h-full">
            {children}
          </div>

        </main>
      </body>
    </html>
  );
}
