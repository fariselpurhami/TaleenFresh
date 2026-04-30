// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

// Singleton instance for client-side operations (Realtime, Zustand bindings)
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export const supabase = createClient();
