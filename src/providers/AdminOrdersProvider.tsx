// src/providers/AdminOrdersProvider.tsx

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

export interface Order {
  id: string;
  status: string;
  [key: string]: unknown;
}

export interface AdminOrdersContextType {
  orders: Order[];
  newOrder: Order | null;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  clearNewOrder: () => void;
}

const AdminOrdersContext = createContext<AdminOrdersContextType | undefined>(undefined);

interface AdminOrdersProviderProps {
  readonly children: ReactNode;
  readonly initialOrders: Order[];
}

export function AdminOrdersProvider({
  children,
  initialOrders,
}: AdminOrdersProviderProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [newOrder, setNewOrder] = useState<Order | null>(null);

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
      }
    };
  }, [scheduleRefresh]);

  useEffect(() => {
    let active = true;

    const channel = supabase
      .channel('admin-global-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (!active) {
            return;
          }

          const insertedOrder = payload.new as Order;

          setOrders((current) => {
            const exists = current.some((order) => order.id === insertedOrder.id);
            return exists ? current : [insertedOrder, ...current];
          });

          setNewOrder(insertedOrder);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (!active) {
            return;
          }

          const updatedOrder = payload.new as Order;

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
        }
      )
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
    async (orderId: string, newStatus: string) => {
      let previousOrder: Order | null = null;

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
          current.map((order) => (order.id === orderId ? previousOrder! : order))
        );

        setNewOrder((current) =>
          current?.id === orderId ? previousOrder : current
        );
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
