// src/hooks/useCart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getTotalItems: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => set((state) => {
        const existing = state.items.find((i) => i.id === newItem.id);
        if (existing) {
          return {
            items: state.items.map((i) => 
              i.id === newItem.id ? { ...i, qty: i.qty + 1 } : i
            )
          };
        }
        return { items: [...state.items, { ...newItem, qty: 1 }] };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),

      updateQty: (id, qty) => set((state) => ({
        items: state.items.map((i) => (i.id === id ? { ...i, qty } : i))
      })),

      clearCart: () => set({ items: [] }),

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.qty), 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.qty, 0);
      }
    }),
    {
      name: 'fresh-market-cart', // Persists to localStorage automatically
    }
  )
);
