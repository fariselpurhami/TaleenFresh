// src/providers/AdminOrdersProvider.tsx

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
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
  children: ReactNode;
  initialOrders: Order[];
}

export function AdminOrdersProvider({ children, initialOrders }: AdminOrdersProviderProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [newOrder, setNewOrder] = useState<Order | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const channel = supabase
      .channel('admin-global-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (!isMounted) return;

          const insertedOrder = payload.new as Order;
          setOrders((current) => [insertedOrder, ...current]);
          setNewOrder(insertedOrder);

        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (!isMounted) return;

          const updatedOrder = payload.new as Order;
          setOrders((current) =>
            current.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
          );
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);

    };
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    let originalStatus = '';

    setOrders((current) =>
      current.map((o) => {
        if (o.id === orderId) {
          originalStatus = o.status;
          return { ...o, status: newStatus };
        }
        return o;
      })
    );

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        throw error;
      }
    } catch (error) {
      setOrders((current) =>
        current.map((o) =>
          o.id === orderId && originalStatus ? { ...o, status: originalStatus } : o
        )
      );
      throw error;
    }
  }, []);

  const clearNewOrder = useCallback(() => {
    setNewOrder(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      orders,
      newOrder,
      updateOrderStatus,
      clearNewOrder,
    }),
    [orders, newOrder, updateOrderStatus, clearNewOrder]
  );

  return (
    <AdminOrdersContext.Provider value={contextValue}>
      {children}
    </AdminOrdersContext.Provider>
  );
}

export const useAdminOrders = (): AdminOrdersContextType => {
  const context = useContext(AdminOrdersContext);

  if (context === undefined) {
    throw new Error('useAdminOrders must be used within an AdminOrdersProvider');
  }

  return context;
};
