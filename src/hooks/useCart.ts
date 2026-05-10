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

export interface CartState {
  items: CartItem[];
  _hasHydrated: boolean;
}

export interface CartActions {
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getTotalItems: () => number;
  setHasHydrated: (state: boolean) => void;
}

export type CartStore = CartState & CartActions;

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get<string>(name);
      return value ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch {
      console.warn(`Failed to save state to IndexedDB for key: ${name}`);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch {
      console.warn(`Failed to remove state from IndexedDB for key: ${name}`);
    }
  },
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      addItem: (newItem: Omit<CartItem, 'qty'>) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === newItem.id);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === newItem.id ? { ...i, qty: i.qty + 1 } : i
              ),
            };
          }

          return { items: [...state.items, { ...newItem, qty: 1 }] };
        }),

      removeItem: (id: string) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQty: (id: string, qty: number) =>
        set((state) => {
          if (qty < 1) {
            return { items: state.items.filter((i) => i.id !== id) };
          }

          return {
            items: state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
          };
        }),

      clearCart: () => set({ items: [] }),

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.qty, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.qty, 0);
      },
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
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          const state = persistedState as Partial<CartState>;
          return {
            items: Array.isArray(state?.items) ? state.items : [],
            _hasHydrated: false,
          } as CartStore;
        }
        return persistedState as CartStore;
      },
    }
  )
);
