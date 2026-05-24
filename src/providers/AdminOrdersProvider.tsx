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
}

type AdminOrdersContextType = {
  orders: AdminOrder[];
  newOrder: AdminOrder | null;
  clearNewOrder: () => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
};

type AdminOrdersProviderProps = {
  initialOrders: AdminOrder[];
  children: ReactNode;
};

const AdminOrdersContext = createContext<AdminOrdersContextType | null>(null);

const upsertOrder = (currentOrders: AdminOrder[], incomingOrder: AdminOrder): AdminOrder[] => {
  const existingIndex = currentOrders.findIndex((order) => order.id === incomingOrder.id);

  if (existingIndex === -1) {
    return [incomingOrder, ...currentOrders];
  }

  const nextOrders = [...currentOrders];
  nextOrders[existingIndex] = incomingOrder;
  return nextOrders;
};

export function AdminOrdersProvider({
  initialOrders,
  children,
}: AdminOrdersProviderProps) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [newOrder, setNewOrder] = useState<AdminOrder | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const ordersRef = useRef<AdminOrder[]>(initialOrders);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    setOrders(initialOrders);
    ordersRef.current = initialOrders;
  }, [initialOrders]);

  const clearNewOrder = useCallback(() => {
    setNewOrder(null);
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const previousOrders = ordersRef.current;

      const optimisticOrders = previousOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      );

      setOrders(optimisticOrders);
      ordersRef.current = optimisticOrders;

      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);

      if (error) {
        setOrders(previousOrders);
        ordersRef.current = previousOrders;
        throw error;
      }
    },
    []
  );

  useEffect(() => {
    let isActive = true;

    const currentChannel = channelRef.current;
    if (currentChannel) {
      void supabase.removeChannel(currentChannel);
      channelRef.current = null;
    }

    const channel = supabase.channel('admin-global-orders');

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (!isActive) {
            return;
          }

          const insertedOrder = payload.new as AdminOrder;
          setOrders((currentOrders) => upsertOrder(currentOrders, insertedOrder));
          setNewOrder(insertedOrder);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (!isActive) {
            return;
          }

          const updatedOrder = payload.new as AdminOrder;
          setOrders((currentOrders) => upsertOrder(currentOrders, updatedOrder));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (!isActive) {
            return;
          }

          const deletedOrderId = String(payload.old.id);

          setOrders((currentOrders) =>
            currentOrders.filter((order) => order.id !== deletedOrderId)
          );

          setNewOrder((currentNewOrder) =>
            currentNewOrder?.id === deletedOrderId ? null : currentNewOrder
          );
        }
      );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      isActive = false;

      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const value = useMemo<AdminOrdersContextType>(
    () => ({
      orders,
      newOrder,
      clearNewOrder,
      updateOrderStatus,
    }),
    [orders, newOrder, clearNewOrder, updateOrderStatus]
  );

  return <AdminOrdersContext.Provider value={value}>{children}</AdminOrdersContext.Provider>;
}

export function useAdminOrders(): AdminOrdersContextType {
  const context = useContext(AdminOrdersContext);

  if (!context) {
    throw new Error('useAdminOrders must be used within AdminOrdersProvider');
  }

  return context;
}
