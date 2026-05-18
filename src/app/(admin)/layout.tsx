// src/app/(admin)/layout.tsx

import React, { ReactNode } from 'react';
import { AdminOrdersProvider } from '@/providers/AdminOrdersProvider';
import { OrderRadar } from '@/components/admin/OrderRadar';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'TaleenFresh Admin Dashboard',
  description: 'لوحة تحكم تالين فريش',
  manifest: '/admin-manifest.json?v=1',
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminOrdersProvider initialOrders={[]}>
      <OrderRadar />
      <div
        className="min-h-screen bg-gray-50 text-gray-900"
        dir="rtl"
      >
        {children}
      </div>
    </AdminOrdersProvider>
  );
}
