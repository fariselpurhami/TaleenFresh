// src/hooks/useCart.ts

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

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
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

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
      name: 'TaleenFresh-cart-idb',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return { items: persistedState.items || [], _hasHydrated: false } as CartState;
        }
        return persistedState as CartState;
      },
    }
  )
);
