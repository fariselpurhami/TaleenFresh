// src/lib/env-server.ts

import 'server-only';
import { z } from 'zod';
import { envClient } from './env-client';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ADMIN_SECRET_PIN: z.string().min(1, 'Admin Pin is required'),
  ADMIN_SECRET_TOKEN: z.string().min(1, 'Admin Token is required'),

  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Redis URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Redis Token is required'),

  PAYMOB_API_KEY: z.string().min(1, 'Paymob API Key is missing'),
  PAYMOB_HMAC_SECRET: z.string().min(1, 'Paymob HMAC Secret is missing'),
  PAYMOB_INTEGRATION_ID: z.string().min(1, 'Paymob Integration ID is missing'),
  PAYMOB_IFRAME_ID: z.string().min(1, 'Paymob Iframe ID is missing'),

  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase Service Role Key is required'),

  WHATSAPP_PHONE_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),

  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  WORKER_SECRET_TOKEN: z.string().min(1, 'Worker Token is required'),
  ADMIN_PROVISIONING_KEY: z.string().min(1, "Provisioning key is required"),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type AppEnv = ServerEnv & typeof envClient;

function createServerEnv(): Readonly<AppEnv> {
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.CI === 'true' ||
    process.env.npm_lifecycle_event === 'build' ||
    process.env.SKIP_ENV_VALIDATION === 'true';

  if (isBuildPhase) {
    return Object.freeze({
      ...(process.env as unknown as ServerEnv),
      ...envClient,
    } as AppEnv);
  }

  const parsedServer = serverSchema.safeParse(process.env);

  if (!parsedServer.success) {
    console.error('[Server Env] CRITICAL: Invalid server environment variables:', parsedServer.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables');
  }

  return Object.freeze({
    ...parsedServer.data,
    ...envClient,
  });
}

export const envServer = createServerEnv();
