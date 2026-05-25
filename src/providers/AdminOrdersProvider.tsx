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
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface OrderItem {
  readonly name: string;
  readonly qty: number;
  readonly price: number;
}

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled';

export interface Order {
  readonly id: string;
  readonly status: OrderStatus | (string & {});
  readonly total_price: number;
  readonly created_at: string;
  readonly customer_name: string;
  readonly customer_phone: string;
  readonly customer_address: string;
  readonly items: readonly OrderItem[];
  readonly [key: string]: unknown;
}

export interface AdminOrdersContextType {
  readonly orders: Order[];
  readonly setOrders: Dispatch<SetStateAction<Order[]>>;
  readonly newOrder: Order | null;
  readonly clearNewOrder: () => void;
}

interface AdminOrdersProviderProps {
  readonly children: ReactNode;
  readonly initialOrders: Order[];
}

interface RealtimeTokenResponse {
  readonly token?: string;
}

const AdminOrdersContext = createContext<AdminOrdersContextType | undefined>(undefined);

const TOKEN_REFRESH_INTERVAL_MS = 4 * 60 * 1000;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function AdminOrdersProvider({
  children,
  initialOrders,
}: AdminOrdersProviderProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [newOrder, setNewOrder] = useState<Order | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialOrdersRef = useRef<Order[]>(initialOrders);

  const clearRealtimeResources = useCallback(() => {
    if (refreshIntervalRef.current !== null) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (channelRef.current !== null) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const fetchTokenAndSetAuth = useCallback(async (signal: AbortSignal): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/realtime-token', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
        signal,
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as RealtimeTokenResponse;
      const token = typeof data.token === 'string' ? data.token : null;

      if (!token) {
        return false;
      }

      supabase.realtime.setAuth(token);
      return true;
    } catch (error) {
      if (isAbortError(error)) {
        return false;
      }

      return false;
    }
  }, []);

  useEffect(() => {
    if (initialOrdersRef.current !== initialOrders) {
      setOrders(initialOrders);
      initialOrdersRef.current = initialOrders;
    }
  }, [initialOrders]);

  useEffect(() => {
    let isMounted = true;
    const bootstrapController = new AbortController();

    const initializeRealtime = async (): Promise<void> => {
      clearRealtimeResources();

      const authenticated = await fetchTokenAndSetAuth(bootstrapController.signal);

      if (!authenticated || !isMounted) {
        return;
      }

      const channel = supabase
        .channel('admin-global-orders')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload: RealtimePostgresInsertPayload<Order>) => {
            if (!isMounted) {
              return;
            }

            const insertedOrder = payload.new as Order;

            setOrders((current) => {
              if (current.some((order) => order.id === insertedOrder.id)) {
                return current;
              }

              return [insertedOrder, ...current];
            });

            setNewOrder(insertedOrder);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload: RealtimePostgresUpdatePayload<Order>) => {
            if (!isMounted) {
              return;
            }

            const updatedOrder = payload.new as Order;

            setOrders((current) => {
              const index = current.findIndex((order) => order.id === updatedOrder.id);

              if (index === -1) {
                return [updatedOrder, ...current];
              }

              const next = [...current];
              next[index] = { ...next[index], ...updatedOrder };
              return next;
            });

            setNewOrder((current) =>
              current?.id === updatedOrder.id ? { ...current, ...updatedOrder } : current
            );
          }
        )
        .subscribe();

      channelRef.current = channel;

      refreshIntervalRef.current = setInterval(() => {
        const refreshController = new AbortController();
        void fetchTokenAndSetAuth(refreshController.signal).finally(() => {
          refreshController.abort();
        });
      }, TOKEN_REFRESH_INTERVAL_MS);
    };

    void initializeRealtime();

    return () => {
      isMounted = false;
      bootstrapController.abort();
      clearRealtimeResources();
    };
  }, [clearRealtimeResources, fetchTokenAndSetAuth]);

  const clearNewOrder = useCallback(() => {
    setNewOrder(null);
  }, []);

  const value = useMemo<AdminOrdersContextType>(
    () => ({
      orders,
      setOrders,
      newOrder,
      clearNewOrder,
    }),
    [orders, newOrder, clearNewOrder]
  );

  return (
    <AdminOrdersContext.Provider value={value}>
      {children}
    </AdminOrdersContext.Provider>
  );
}

export function useAdminOrders(): AdminOrdersContextType {
  const context = useContext(AdminOrdersContext);

  if (context === undefined) {
    throw new Error('useAdminOrders must be used within an AdminOrdersProvider');
  }

  return context;
}
