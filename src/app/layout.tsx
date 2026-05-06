// src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  display: 'swap', 
  variable: '--font-cairo', 
  weight: ['400', '500', '700', '900'], 
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
  viewportFit: 'cover', 
  themeColor: '#2C643E', 
};

export const metadata: Metadata = {
  title: {
    template: '%s | TaleenFresh',
    default: 'TaleenFresh | تالين فريش',
  },
  description: 'مُنتجات طازجة تُقطف بعناية لتصلك بأعلى جودة.',
  manifest: '/manifest.ts', 
  applicationName: 'TaleenFresh',
  
  appleWebApp: {
    capable: true,
    title: 'TaleenFresh',
    statusBarStyle: 'black-translucent', 
  },
  
  formatDetection: {
    telephone: false, 
  },
  
  icons: {
    icon: '/icon-512x512.png',
    apple: '/icon-512x512.png', 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} scroll-smooth`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased selection:bg-[#2C643E]/20 selection:text-[#2C643E] bg-pattern-watermark custom-scrollbar overflow-x-hidden flex flex-col mx-auto relative shadow-2xl transition-all duration-500 ease-in-out
  max-w-[430px] portrait:max-w-[430px] landscape:max-w-full md:max-w-[430px] md:landscape:max-w-full"
      >
        {children}
      </body>
    </html>
  );
}
