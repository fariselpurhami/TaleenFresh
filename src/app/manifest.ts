//  src/app/manifest.ts

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Taleen Fresh | تالين فريش',
    short_name: 'TaleenFresh',
    description: 'أجود أنواع الخضار والفاكهة طازة لحد باب بيتك',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#16a34a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'لوحة الإدارة',
        short_name: 'الإدارة',
        description: 'إدارة المنتجات وتعديل الأسعار',
        url: '/admin',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'طلبات العملاء',
        short_name: 'الطلبات',
        description: 'متابعة الأوردرات الجديدة',
        url: '/admin/orders',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    ],
  };
}
