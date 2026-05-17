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
  setHasHydrated: (state: boolean) => void;
}

export type CartStore = CartState & CartActions;

const IDB_KEY = 'TaleenFresh-cart-idb';
const FALLBACK_KEY = `${IDB_KEY}:fallback`;

let hasAttemptedHeal = false;

const telemetry = {
  captureError: (name: string, error: unknown, context?: Record<string, unknown>) => {
    console.error(`[Telemetry - Error] ${name}`, error, context);
  },
  captureEvent: (name: string, context?: Record<string, unknown>) => {
    console.warn(`[Telemetry - Event] ${name}`, context);
  },
};

const canUseIndexedDB = () =>
  typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

const safeLocalStorage = {
  getItem(name: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {}
  },
  removeItem(name: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {}
  },
};

const selfHealingStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    if (canUseIndexedDB()) {
      try {
        const value = await get<string>(name);
        if (value != null) {
          hasAttemptedHeal = false;
          return value;
        }
      } catch (error) {
        telemetry.captureError('IDB_READ_FAILED', error, { key: name });
      }
    }

    const fallbackValue = safeLocalStorage.getItem(FALLBACK_KEY);

    if (fallbackValue != null && !hasAttemptedHeal && canUseIndexedDB()) {
      hasAttemptedHeal = true;
      telemetry.captureEvent('STORAGE_SELF_HEALING_TRIGGERED', { key: name });

      set(name, fallbackValue)
        .then(() => {
          safeLocalStorage.removeItem(FALLBACK_KEY);
          hasAttemptedHeal = false;
        })
        .catch((error) => {
          telemetry.captureError('IDB_RESTORE_FAILED', error, { key: name });
        });
    }

    return fallbackValue;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;

    if (canUseIndexedDB()) {
      try {
        await set(name, value);
        safeLocalStorage.removeItem(FALLBACK_KEY);
        hasAttemptedHeal = false;
        return;
      } catch (error) {
        telemetry.captureError('IDB_WRITE_FAILED', error, { key: name });
      }
    }

    safeLocalStorage.setItem(FALLBACK_KEY, value);
  },

  removeItem: async (name: string): Promise<void> => {
    if (typeof window === 'undefined') return;

    if (canUseIndexedDB()) {
      try {
        await del(name);
      } catch (error) {
        telemetry.captureError('IDB_REMOVE_FAILED', error, { key: name });
      }
    }

    safeLocalStorage.removeItem(FALLBACK_KEY);
  },
};

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      addItem: (newItem: Omit<CartItem, 'qty'>) =>
        set((state) => {
          const itemIndex = state.items.findIndex((i) => i.id === newItem.id);

          if (itemIndex > -1) {
            const items = [...state.items];
            items[itemIndex] = { ...items[itemIndex], qty: items[itemIndex].qty + 1 };
            return { items };
          }

          return { items: [...state.items, { ...newItem, qty: 1 }] };
        }),

      removeItem: (id: string) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQty: (id: string, qty: number) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i.id !== id) };
          }
          
          return {
            items: state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
          };
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: IDB_KEY,
      version: 2,
      storage: createJSONStorage(() => selfHealingStorage),
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          telemetry.captureError('STORE_HYDRATION_FAILED', error);
        }
        if (state) {
          state.setHasHydrated(true);
        }
      },
      migrate: (persistedState: unknown) => {
        const state = (persistedState as Partial<CartState>) || {};
        return {
          items: Array.isArray(state.items) ? state.items : [],
          _hasHydrated: false,
        } as CartStore;
      },
    }
  )
);

export const selectCartTotal = (state: CartStore): number =>
  state.items.reduce((total, item) => total + item.price * item.qty, 0);

export const selectTotalItems = (state: CartStore): number =>
  state.items.reduce((total, item) => total + item.qty, 0);
