// src/store/useCustomer.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

interface Address {
  id: string;
  tag: string; // مثال: "المنزل", "العمل"
  details: string;
}

interface CustomerState {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  phone: string | null;
  fullName: string | null;
  addresses: Address[];
  orderHistory: any[];
  
  // Actions
  checkSession: () => Promise<void>;
  loginWithOTP: (phone: string) => Promise<{ error: any }>;
  verifyOTP: (phone: string, otp: string) => Promise<{ error: any }>;
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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      set({ isAuthenticated: true, phone: session.user.phone });
      await get().fetchProfileData(session.user.id);
    } else {
      set({ isAuthenticated: false, phone: null });
    }
    set({ isCheckingAuth: false });
  },

  fetchProfileData: async (userId: string) => {
    // جلب البيانات الشخصية والطلبات السابقة بالتوازي (Parallel Fetching للأداء الأقصى)
    const [profileRes, ordersRes] = await Promise.all([
      supabase.from('customer_profiles').select('*').eq('id', userId).single(),
      supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    if (profileRes.data) {
      set({ 
        fullName: profileRes.data.full_name, 
        addresses: profileRes.data.saved_addresses || [] 
      });
    }
    if (ordersRes.data) {
      set({ orderHistory: ordersRes.data });
    }
  },

  loginWithOTP: async (phone: string) => {
    // نرسل OTP عبر الواتساب أو الـ SMS
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error };
  },

  verifyOTP: async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (data.session) {
      set({ isAuthenticated: true, phone: data.session.user.phone });
      await get().fetchProfileData(data.session.user.id);
    }
    return { error };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, phone: null, fullName: null, addresses: [], orderHistory: [] });
  }
}));
