// src/lib/env-client.ts

import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STORE_NAME: z.string().min(1).default('TaleenFresh'),
  NEXT_PUBLIC_CURRENCY: z.string().min(1).default('LE'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type ClientEnv = z.infer<typeof clientSchema>;

function createClientEnv(): Readonly<ClientEnv> {
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.CI === 'true' ||
    process.env.npm_lifecycle_event === 'build' ||
    process.env.SKIP_ENV_VALIDATION === 'true';

  const clientEnvData = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STORE_NAME: process.env.NEXT_PUBLIC_STORE_NAME,
    NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  if (isBuildPhase) {
    return Object.freeze({
      ...(process.env as unknown as ClientEnv),
      ...clientEnvData,
    } as ClientEnv);
  }

  const parsedClient = clientSchema.safeParse(clientEnvData);

  if (!parsedClient.success) {
    console.error('[Client Env] CRITICAL: Invalid client environment variables:', parsedClient.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }

  return Object.freeze(parsedClient.data);
}

export const envClient = createClientEnv();
