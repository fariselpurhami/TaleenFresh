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

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="ar" 
      dir="rtl" 
      className={cairo.variable} 
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
