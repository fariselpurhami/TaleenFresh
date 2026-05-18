// src/app/(main)/layout.tsx

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  applicationName: 'Taleen Fresh | تالين فريش',
  title: {
    default: 'Taleen Fresh | تالين فريش',
    template: '%s | Taleen Fresh',
  },
  description: 'أجود أنواع الخضار والفاكهة طازة لحد باب بيتك',
  manifest: '/main-manifest.json?v=1',
  appleWebApp: {
    capable: true,
    title: 'TaleenFresh',
    statusBarStyle: 'default',
    startupImage: [
      {
        url: '/icons/apple-splash-2048x2732.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/icons/apple-splash-1668x2388.png',
        media:
          '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/icons/apple-splash-1290x2796.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#16a34a' },
  ],
  colorScheme: 'light',
};

interface MainLayoutProps {
  readonly children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return children;
}
