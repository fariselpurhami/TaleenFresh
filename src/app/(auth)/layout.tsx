import '@/app/globals.css';
import { Noto_Kufi_Arabic } from 'next/font/google';

const notoKufi = Noto_Kufi_Arabic({ subsets: ['arabic'], variable: '--font-noto-kufi' });

export default function AuthLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`bg-gray-50 flex items-center justify-center min-h-screen ${notoKufi.variable} font-arabic antialiased`}>
        {children}
      </body>
    </html>
  );
}
