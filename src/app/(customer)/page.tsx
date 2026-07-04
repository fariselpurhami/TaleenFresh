// src/app/(customer)/page.tsx

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Storefront from '@/components/customer/Storefront';

export const revalidate = 60;
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
          } catch {}
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

          <div className="mb-2 flex items-center justify-between gap-4">
            <div className="relative h-10 w-[200px] shrink-0 md:h-[80px] md:w-[300px]">
              <Image
                src="/TaleenFresh.webp"
                alt="TaleenFresh"
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 170px, 280px"
                className="object-contain object-left"
              />
            </div>

            <nav aria-label="Social media" className="ml-auto flex items-center justify-end gap-1">
              <a
                href="https://facebook.com/taleenfresh"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#2C643E] transition-transform duration-200 hover:scale-110 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.099 4.388 23.094 10.125 24v-8.438H7.078v-3.489h3.047V9.413c0-3.017 1.792-4.686 4.533-4.686 1.313 0 2.686.235 2.686.235v2.962H15.83c-1.491 0-1.956.928-1.956 1.88v2.257h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.099 24 12.073Z" />
                </svg>
              </a>
            </nav>
          </div>

          <p className="text-sm font-light tracking-wide text-slate-500 md:text-lg">
            Nature&apos;s best produce, straight to your door.
          </p>
        </header>

        <Storefront initialProducts={initialProducts ?? []} />
      </div>
    </main>
  );
}
