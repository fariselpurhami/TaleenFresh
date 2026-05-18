// src/app/(admin)/layout.tsx

import { type ReactNode } from 'react';
import type { Metadata } from 'next';
import { AdminOrdersProvider } from '@/providers/AdminOrdersProvider';
import { OrderRadar } from '@/components/admin/OrderRadar';

export const metadata: Metadata = {
  title: {
    default: 'Taleen Admin',
    template: '%s | Taleen Admin',
  },
  description: 'لوحة تحكم تالين فريش',
  applicationName: 'Taleen Admin',
  manifest: '/admin-manifest.json?v=7',
  appleWebApp: {
    capable: true,
    title: 'Taleen Admin',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
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
        dir="rtl"
        className="flex min-h-dvh w-full flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-600 selection:text-white"
      >
        {children}
      </main>
    </AdminOrdersProvider>
  );
}
