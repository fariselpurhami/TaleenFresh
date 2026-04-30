// src/app/(customer)/page.tsx
import { createClient } from '@supabase/supabase-js';
import Storefront from '@/components/customer/Storefront';

// Force dynamic rendering for real-time inventory accuracy.
export const revalidate = 0; 

export default async function CustomerHomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Initial fetch for SSR
  const { data: initialProducts } = await supabase
    .from('products')
    .select('*')
    .order('name_en', { ascending: true });

  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-32 selection:bg-emerald-200 selection:text-emerald-900">
      {/* Enforcing Left-to-Right layout for the global brand feel */}
      <div className="max-w-3xl mx-auto px-6 pt-4 text-left" dir="ltr">
        
        <header className="mb-12">
          {/* Typography engineered for a premium global brand */}
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
            Taleen<span className="text-emerald-600">Fresh</span>
          </h1>
          
          {/* Refined, elegant, and simple subtitle */}
          <p className="text-slate-500 text-lg md:text-xl font-light mt-3 tracking-wide">
            Nature's best produce, straight to your door.
          </p>
        </header>
        
        {/* Pass SSR data to the Client Component */}
        <Storefront initialProducts={initialProducts || []} />
        
      </div>
    </main>
  );
}
