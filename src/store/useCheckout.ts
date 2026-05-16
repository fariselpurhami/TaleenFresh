// src/store/useCheckout.ts 

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(name, value);
    } catch {}
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(name);
    } catch {}
  },
};

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

export interface CheckoutState {
  customerInfo: CustomerInfo;
  hasHydrated: boolean;
  setCustomerInfo: (info: Partial<CustomerInfo>) => void;
  resetCustomerInfo: () => void;
  setHasHydrated: (value: boolean) => void;
}

const initialCustomerInfo: CustomerInfo = {
  name: '',
  phone: '',
  address: '',
};

export const useCheckout = create<CheckoutState>()(
  persist(
    (set) => ({
      customerInfo: initialCustomerInfo,
      hasHydrated: false,
      setCustomerInfo: (info) =>
        set((state) => ({
          customerInfo: {
            ...state.customerInfo,
            ...info,
          },
        })),
      resetCustomerInfo: () =>
        set({
          customerInfo: initialCustomerInfo,
        }),
      setHasHydrated: (value) =>
        set({
          hasHydrated: value,
        }),
    }),
    {
      name: 'taleenfresh-checkout',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        customerInfo: state.customerInfo,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
