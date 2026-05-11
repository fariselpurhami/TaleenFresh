// src/lib/env.ts

import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  WORKER_SECRET_TOKEN: z.string().min(1),
  ADMIN_SECRET_PIN: z.string().min(1),
  ADMIN_SECRET_TOKEN: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  PAYMOB_HMAC_SECRET: z.string().min(1).optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  PAYMOB_API_KEY: z.string().min(1).optional(),
  PAYMOB_INTEGRATION_ID: z.string().min(1).optional(),
  PAYMOB_IFRAME_ID: z.string().min(1).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;
export type AppEnv = ServerEnv & ClientEnv;

function createEnv(): Readonly<AppEnv> {
  const isServer = typeof window === 'undefined';

  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.CI === 'true' ||
    process.env.npm_lifecycle_event === 'build' ||
    process.env.SKIP_ENV_VALIDATION === 'true';

  const clientEnvData = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  if (isBuildPhase) {
    return Object.freeze({
      ...(process.env as unknown as ServerEnv),
      ...clientEnvData,
    } as AppEnv);
  }

  const parsedClient = clientSchema.safeParse(clientEnvData);

  if (!parsedClient.success) {
    console.error('Invalid client environment variables:', parsedClient.error.flatten().fieldErrors);
    throw new Error('CRITICAL: Invalid client environment variables.');
  }

  if (isServer) {
    const serverEnvData = {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      WORKER_SECRET_TOKEN: process.env.WORKER_SECRET_TOKEN,
      ADMIN_SECRET_PIN: process.env.ADMIN_SECRET_PIN,
      ADMIN_SECRET_TOKEN: process.env.ADMIN_SECRET_TOKEN,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      PAYMOB_HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET,
      WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID,
      WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    };

    const parsedServer = serverSchema.safeParse(serverEnvData);

    if (!parsedServer.success) {
      console.error('Invalid server environment variables:', parsedServer.error.flatten().fieldErrors);
      throw new Error('CRITICAL: Invalid server environment variables.');
    }

    return Object.freeze({ ...parsedServer.data, ...parsedClient.data });
  }

  return Object.freeze({ ...parsedClient.data } as AppEnv);
}

export const env = createEnv();
