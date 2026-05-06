// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

// 1. الأداء العالي: تحميل الخط بذكاء (Smart Font Loading)
const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  display: 'swap', // يمنع اختفاء النص أثناء تحميل الخط
  variable: '--font-cairo', // نستخدمه كمتغير للتحكم الدقيق
  weight: ['400', '500', '700', '900'], // تحميل الأوزان الضرورية فقط لتسريع الأداء
});

// 2. هندسة شاشة الموبايل (Native App Experience)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // يمنع زووم المتصفح المزعج
  viewportFit: 'cover', // يضمن ملء الشاشة للآيفون (Notch/Dynamic Island)
  themeColor: '#2C643E', // لون شريط الحالة (Status Bar)
};

// 3. تحسين محركات البحث و PWA (Enterprise SEO & PWA Meta)
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
    statusBarStyle: 'default', // يجعل شريط الآيفون شفافاً ومتناسقاً
  },
  formatDetection: {
    telephone: false, // يمنع المتصفح من تحويل الأرقام العشوائية لروابط اتصال بالخطأ
  },
  icons: {
    icon: '/icon-512x512.png',
    apple: '/icon-512x512.png', // أيقونة شاشة الآيفون
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 4. البنية التحتية القوية للـ HTML
    // نحقن متغير الخط (variable) لكي يقرأه Tailwind بذكاء
    <html lang="ar" dir="rtl" className={`${cairo.variable} scroll-smooth`}>
      {/* 5. تصميم الجسم (Body) المقاوم للكسر */}
      <body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased selection:bg-[#2C643E]/20 selection:text-[#2C643E] bg-pattern-watermark custom-scrollbar overflow-x-hidden flex flex-col">
        {/* المحتوى يتم حقنه هنا بأمان */}
        {children}
      </body>
    </html>
  );
}
