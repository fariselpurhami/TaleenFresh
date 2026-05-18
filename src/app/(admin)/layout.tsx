// src/app/(admin)/layout.tsx

import { type ReactNode } from 'react';
import type { Metadata } from 'next';
import { AdminOrdersProvider } from '@/providers/AdminOrdersProvider';
import { OrderRadar } from '@/components/admin/OrderRadar';

export const metadata: Metadata = {
  title: 'TaleenFresh Admin Dashboard',
  description: 'لوحة تحكم تالين فريش',
  manifest: '/admin-manifest.json?v=1',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

interface AdminLayoutProps {
  readonly children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminOrdersProvider initialOrders={[]}>
      <OrderRadar />
      <main
        className="flex min-h-[100dvh] w-full flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-600 selection:text-white"
        dir="rtl"
      >
        {children}
      </main>
    </AdminOrdersProvider>
  );
}
