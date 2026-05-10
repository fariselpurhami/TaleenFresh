// src/store/useCustomer.ts

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

export interface Address {
  id: string;
  tag: string;
  details: string;
}

export interface OrderHistoryItem {
  id: string;
  created_at: string;
  total_price: number;
  status: string;
  [key: string]: unknown;
}

export interface CustomerState {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  phone: string | null;
  fullName: string | null;
  addresses: Address[];
  orderHistory: OrderHistoryItem[];

  checkSession: () => Promise<void>;
  loginWithOTP: (phone: string) => Promise<{ error: Error | null }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  fetchProfileData: (userId: string) => Promise<void>;
}

export const useCustomer = create<CustomerState>((set, get) => ({
  isAuthenticated: false,
  isCheckingAuth: true,
  phone: null,
  fullName: null,
  addresses: [],
  orderHistory: [],

  checkSession: async () => {
    set({ isCheckingAuth: true });

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        set({
          isAuthenticated: true,
          phone: session.user.phone ?? null
        });
        await get().fetchProfileData(session.user.id);
      } else {
        set({
          isAuthenticated: false,
          phone: null,
          fullName: null,
          addresses: [],
          orderHistory: []
        });
      }
    } catch (error) {
      console.error('[useCustomer] Session check failed:', error);
      set({
        isAuthenticated: false,
        phone: null,
        fullName: null,
        addresses: [],
        orderHistory: []
      });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  fetchProfileData: async (userId: string) => {
    try {
      const [profileRes, ordersRes] = await Promise.all([
        supabase
          .from('customer_profiles')
          .select('full_name, saved_addresses')
          .eq('id', userId)
          .single(),
        supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      ]);

      if (profileRes.data) {
        set({
          fullName: profileRes.data.full_name ?? null,
          addresses: Array.isArray(profileRes.data.saved_addresses)
            ? profileRes.data.saved_addresses
            : []
        });
      }

      if (ordersRes.data) {
        set({ orderHistory: ordersRes.data as OrderHistoryItem[] });
      }
    } catch (error) {
      console.error('[useCustomer] Failed to fetch profile data:', error);
    }
  },

  loginWithOTP: async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Unknown error during OTP request') };
    }
  },

  verifyOTP: async (phone: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms'
      });

      if (error) return { error };

      if (data.session?.user) {
        set({
          isAuthenticated: true,
          phone: data.session.user.phone ?? null
        });
        await get().fetchProfileData(data.session.user.id);
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Unknown error during OTP verification') };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[useCustomer] Logout failed:', error);
    } finally {
      set({
        isAuthenticated: false,
        phone: null,
        fullName: null,
        addresses: [],
        orderHistory: []
      });
    }
  }
}));
