// src/app/layout.tsx

import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TaleenFresh | تالين فريش',
    template: '%s | TaleenFresh',
  },
  description: 'مُنتجات طازجة تُقطف بعناية لتصلك بأعلى جودة.',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 👇 السر كله في الكلمة دي suppressHydrationWarning
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
