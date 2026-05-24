'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface AdminOrder {
  id: string;
  status: OrderStatus;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total_price: number;
  [key: string]: unknown;
}

export interface AdminOrdersContextType {
  orders: AdminOrder[];
  newOrder: AdminOrder | null;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  clearNewOrder: () => void;
}

const AdminOrdersContext = createContext<AdminOrdersContextType | undefined>(undefined);

interface AdminOrdersProviderProps {
  readonly children: ReactNode;
  readonly initialOrders: AdminOrder[];
}

export function AdminOrdersProvider({
  children,
  initialOrders,
}: AdminOrdersProviderProps) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [newOrder, setNewOrder] = useState<AdminOrder | null>(null);

  const router = useRouter();
  const refreshFrameRef = useRef<number | null>(null);
  const lastRefreshAtRef = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const scheduleRefresh = useCallback(() => {
    const now = Date.now();

    if (now - lastRefreshAtRef.current < 1500) {
      return;
    }

    lastRefreshAtRef.current = now;

    if (refreshFrameRef.current !== null) {
      cancelAnimationFrame(refreshFrameRef.current);
    }

    refreshFrameRef.current = window.requestAnimationFrame(() => {
      router.refresh();
      refreshFrameRef.current = null;
    });
  }, [router]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleRefresh();
      }
    };

    const handleWindowFocus = () => {
      scheduleRefresh();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);

      if (refreshFrameRef.current !== null) {
        cancelAnimationFrame(refreshFrameRef.current);
        refreshFrameRef.current = null;
      }
    };
  }, [scheduleRefresh]);

  useEffect(() => {
    let active = true;

    const handleInsert = (payload: { new: Record<string, unknown> }) => {
      if (!active) {
        return;
      }

      const insertedOrder = payload.new as AdminOrder;

      setOrders((current) => {
        const exists = current.some((order) => order.id === insertedOrder.id);
        return exists ? current : [insertedOrder, ...current];
      });

      setNewOrder(insertedOrder);
    };

    const handleUpdate = (payload: { new: Record<string, unknown> }) => {
      if (!active) {
        return;
      }

      const updatedOrder = payload.new as AdminOrder;

      setOrders((current) => {
        const exists = current.some((order) => order.id === updatedOrder.id);

        if (!exists) {
          return [updatedOrder, ...current];
        }

        return current.map((order) =>
          order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
        );
      });

      setNewOrder((current) =>
        current?.id === updatedOrder.id ? { ...current, ...updatedOrder } : current
      );
    };

    const handleDelete = (payload: { old: Record<string, unknown> }) => {
      if (!active) {
        return;
      }

      const deletedId =
        typeof payload.old.id === 'string' ? payload.old.id : String(payload.old.id ?? '');

      if (!deletedId) {
        return;
      }

      setOrders((current) => current.filter((order) => order.id !== deletedId));
      setNewOrder((current) => (current?.id === deletedId ? null : current));
    };

    const channel = supabase
      .channel('admin-global-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, handleInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, handleUpdate)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, handleDelete)
      .subscribe();

    channelRef.current = channel;

    return () => {
      active = false;

      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      let previousOrder: AdminOrder | null = null;

      setOrders((current) =>
        current.map((order) => {
          if (order.id !== orderId) {
            return order;
          }

          previousOrder = order;
          return { ...order, status: newStatus };
        })
      );

      setNewOrder((current) =>
        current?.id === orderId ? { ...current, status: newStatus } : current
      );

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (!error) {
        return;
      }

      if (previousOrder) {
        setOrders((current) =>
          current.map((order) => (order.id === orderId ? previousOrder as AdminOrder : order))
        );

        setNewOrder((current) => (current?.id === orderId ? previousOrder : current));
      }

      throw error;
    },
    []
  );

  const clearNewOrder = useCallback(() => {
    setNewOrder(null);
  }, []);

  const value = useMemo<AdminOrdersContextType>(
    () => ({
      orders,
      newOrder,
      updateOrderStatus,
      clearNewOrder,
    }),
    [orders, newOrder, updateOrderStatus, clearNewOrder]
  );

  return <AdminOrdersContext.Provider value={value}>{children}</AdminOrdersContext.Provider>;
}

export function useAdminOrders(): AdminOrdersContextType {
  const context = useContext(AdminOrdersContext);

  if (!context) {
    throw new Error('useAdminOrders must be used within an AdminOrdersProvider');
  }

  return context;
}
