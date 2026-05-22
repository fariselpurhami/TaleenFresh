import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Storefront from '@/components/customer/Storefront';

export const dynamic = 'force-dynamic';

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
          } catch {
            //
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
    <main className="min-h-[100dvh] bg-transparent pb-32 selection:bg-emerald-200 selection:text-emerald-900">
      <div className="mx-auto max-w-3xl px-6 pt-6 text-left" dir="ltr">
        <header className="mb-6">
          <h1 className="sr-only">TaleenFresh</h1>

          <div className="relative mb-2 h-8 w-full max-w-[170px] md:h-18 md:max-w-[280px]">
            <Image
              src="/TaleenFresh.png"
              alt="TaleenFresh"
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 200px, 350px"
              className="object-contain object-left"
            />
          </div>

          <p className="text-sm font-light tracking-wide text-slate-500 md:text-lg">
            Nature's best produce, straight to your door.
          </p>
        </header>

        <Storefront initialProducts={initialProducts ?? []} />
      </div>
    </main>
  );
}
