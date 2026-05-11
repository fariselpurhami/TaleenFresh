//  src/lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { envClient } from '@/lib/env-client';

export const createClient = (): SupabaseClient => {
  return createBrowserClient(
    envClient.NEXT_PUBLIC_SUPABASE_URL,
    envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

export const supabase: SupabaseClient = createClient();
