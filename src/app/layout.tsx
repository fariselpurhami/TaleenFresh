// src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';

import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '700', '900'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2C643E',
};

export const metadata: Metadata = {
  title: {
    template: '%s | TaleenFresh',
    default: 'TaleenFresh | تالين فريش',
  },
  description: 'مُنتجات طازجة تُقطف بعناية لتصلك بأعلى جودة.',
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
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        className="mx-auto flex min-h-dvh max-w-[430px] flex-col overflow-x-hidden bg-background font-sans text-foreground shadow-2xl antialiased selection:bg-primary/20 selection:text-primary bg-pattern-watermark landscape:max-w-full md:landscape:max-w-full"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
