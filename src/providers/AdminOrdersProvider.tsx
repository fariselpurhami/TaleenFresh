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
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
};

const AdminOrdersContext = createContext<AdminOrdersContextType | null>(null);

type AdminOrdersProviderProps = {
  initialOrders: AdminOrder[];
  children: ReactNode;
};

const upsertOrder = (currentOrders: AdminOrder[], incomingOrder: AdminOrder): AdminOrder[] => {
  const index = currentOrders.findIndex((order) => order.id === incomingOrder.id);

  if (index === -1) {
    return [incomingOrder, ...currentOrders];
  }

  const nextOrders = [...currentOrders];
  nextOrders[index] = incomingOrder;
  return nextOrders;
};

export function AdminOrdersProvider({
  initialOrders,
  children,
}: AdminOrdersProviderProps) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const previousOrders = orders;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        setOrders(previousOrders);
        throw error;
      }
    },
    [orders]
  );

  useEffect(() => {
    let isActive = true;

    const existingChannel = channelRef.current;
    if (existingChannel) {
      void supabase.removeChannel(existingChannel);
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

          const newOrder = payload.new as AdminOrder;
          setOrders((currentOrders) => upsertOrder(currentOrders, newOrder));
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
      updateOrderStatus,
    }),
    [orders, updateOrderStatus]
  );

  return (
    <AdminOrdersContext.Provider value={value}>
      {children}
    </AdminOrdersContext.Provider>
  );
}

export function useAdminOrders(): AdminOrdersContextType {
  const context = useContext(AdminOrdersContext);

  if (!context) {
    throw new Error('useAdminOrders must be used within AdminOrdersProvider');
  }

  return context;
}
