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
    default: 'TaleenFresh | تالين فريش - من الطبيعة لبيتك',
  },
  description: 'تطبيق تالين فريش لطلب أفضل وأجود أنواع الخضار والفاكهة الطازجة في كفر الشيخ. توصيل سريع ومضمون.',
  manifest: '/manifest.ts',
  applicationName: 'TaleenFresh',
  appleWebApp: {
    capable: true,
    title: 'TaleenFresh',
    statusBarStyle: 'default',
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
      
      <body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased selection:bg-[#2C643E]/20 selection:text-[#2C643E] bg-pattern-watermark custom-scrollbar overflow-x-hidden flex flex-col">
        {children}
      </body>
    </html>
  );
}
