// src/app/(admin)/layout.tsx
import '@/app/globals.css';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Noto_Kufi_Arabic } from 'next/font/google';

const notoKufi = Noto_Kufi_Arabic({ subsets: ['arabic'], variable: '--font-noto-kufi' });

export const revalidate = 0;

export default async function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('taleen_admin_token');
  
  // حارس البوابة: لو الكوكي مش موجود، اطرده بره
  if (token?.value !== 'secure_access_2026') {
    redirect('/admin-login');
  }

  return (
    <html lang="ar" dir="rtl">
      <body className={`bg-gray-100 min-h-screen ${notoKufi.variable} font-arabic antialiased`}>
        <div className="max-w-7xl mx-auto p-4">
          {children}
        </div>
      </body>
    </html>
  );
}
