// src/app/(admin)/layout.tsx
import { AdminOrdersProvider } from '@/providers/AdminOrdersProvider';
import { OrderRadar } from '@/components/admin/OrderRadar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // بنمرر مصفوفة فاضية لأن page.tsx هي العقل المدبر الجديد
    <AdminOrdersProvider initialOrders={[]}>
      <OrderRadar />
      <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
        {children}
      </div>
    </AdminOrdersProvider>
  );
}
