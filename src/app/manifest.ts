// src/app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Taleen Fresh | تالين فريش',
    short_name: 'TaleenFresh',
    description: 'أجود أنواع الخضار والفاكهة طازة لحد باب بيتك',
    start_url: '/',
    display: 'standalone', // Crucial: Hides browser UI
    background_color: '#f9fafb', // matches gray-50
    theme_color: '#16a34a', // Updated to Tailwind green-600 for a fresh, native app feel in the status bar
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png', // Ensure these exist in the /public folder
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
    // The Silicon Valley Touch: App Shortcuts for long-press actions
    shortcuts: [
      {
        name: 'لوحة الإدارة',
        short_name: 'الإدارة',
        description: 'إدارة المنتجات وتعديل الأسعار',
        url: '/admin',
        // استخدمت نفس الأيقونة مؤقتاً، تقدر تحط أيقونة مخصصة للإدارة بعدين في فولدر public
        icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }] 
      },
      {
        name: 'طلبات العملاء',
        short_name: 'الطلبات',
        description: 'متابعة الأوردرات الجديدة',
        url: '/admin/orders', // تأكد إن ده مسار صفحة الطلبات عندك
        icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }]
      }
    ]
  };
}
