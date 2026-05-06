// src/providers/AdminOrdersProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';

interface AdminOrdersContextType {
  orders: any[];
  newOrder: any | null;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  clearNewOrder: () => void;
}

const AdminOrdersContext = createContext<AdminOrdersContextType | undefined>(undefined);

export function AdminOrdersProvider({ children, initialOrders }: { children: ReactNode, initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [newOrder, setNewOrder] = useState<any | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    
    const channel = supabase
      .channel('admin-global-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const insertedOrder = payload.new;
        setOrders((current) => [insertedOrder, ...current]);
        setNewOrder(insertedOrder);
        
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.warn('Audio blocked by browser:', e));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updatedOrder = payload.new;
        setOrders((current) => current.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {

    const prevOrders = [...orders];
    setOrders((current) => current.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      console.error('Failed to update status:', error);
      setOrders(prevOrders); 
    }
  };

  const clearNewOrder = () => setNewOrder(null);

  return (
    <AdminOrdersContext.Provider value={{ orders, newOrder, updateOrderStatus, clearNewOrder }}>
      {children}
    </AdminOrdersContext.Provider>
  );
}

export const useAdminOrders = () => {
  const context = useContext(AdminOrdersContext);
  if (!context) throw new Error("useAdminOrders must be used within AdminOrdersProvider");
  return context;
};
