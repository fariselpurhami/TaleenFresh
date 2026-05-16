// src/app/(customer)/page.tsx

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Storefront from '@/components/customer/Storefront';

export const revalidate = 0; 

export default async function CustomerHomePage() {
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            
          }
        },
      },
    }
  );

  const { data: initialProducts } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  return (
    <main className="min-h-screen bg-transparent pb-32 selection:bg-emerald-200 selection:text-emerald-900">
   
      <div className="max-w-3xl mx-auto px-6 pt-4 text-left" dir="ltr">
        
        <header className="mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
            Taleen<span className="text-[#2C643E]">Fresh</span>
          </h1>
          
          <p className="text-slate-500 text-lg md:text-xl font-light mt-3 tracking-wide">
            Nature's best produce, straight to your door.
          </p>
        </header>
        
        <Storefront initialProducts={initialProducts || []} />
        
      </div>
    </main>
  );
}
