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

interface CustomerLayoutProps {
  readonly children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div
      className={cn(
        'relative flex w-full min-h-screen font-arabic text-foreground antialiased',
        'bg-background lg:bg-transparent lg:items-center lg:justify-center',
        notoKufi.variable,
        inter.variable
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 mix-blend-multiply will-change-transform"
        style={{
          backgroundImage: "url('/pattern.jpg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '400px',
          backgroundPosition: 'center 0',
          opacity: 0.32,
        }}
      />
      
      <main
        className={cn(
          'relative z-10 flex min-h-screen w-full flex-col bg-transparent',
          'lg:h-[90vh] lg:min-h-[90vh] lg:max-w-[430px] lg:overflow-x-hidden lg:overflow-y-auto lg:rounded-[2.5rem] lg:shadow-2xl',
          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[100] h-[max(env(safe-area-inset-top),1.25rem)] w-full bg-[#f8f9fa]/85 backdrop-blur-md md:hidden"
        />
        
        <div className="relative z-10 flex flex-1 flex-col h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
