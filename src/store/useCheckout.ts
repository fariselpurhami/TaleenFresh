// src/store/useCheckout.ts

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Ignore write errors
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Ignore remove errors
    }
  },
};

export interface CustomerInfo {
  fullName: string;
  phone: string;
  address: string;
}

export interface CheckoutState {
  customerInfo: CustomerInfo;
  setCustomerInfo: (info: Partial<CustomerInfo>) => void;
}

export const useCheckout = create<CheckoutState>()(
  persist(
    (set) => ({
      customerInfo: {
        fullName: '',
        phone: '',
        address: '',
      },

      setCustomerInfo: (info: Partial<CustomerInfo>) =>
        set((state) => ({
          customerInfo: { ...state.customerInfo, ...info },
        })),
    }),
    {
      name: 'TaleenFresh-guest-info',
      storage: createJSONStorage(() => safeLocalStorage),
      skipHydration: typeof window === 'undefined',
    }
  )
);
