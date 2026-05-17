// src/modules/paymob-webhook/infrastructure/env.ts

export function getRequiredEnvVar(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`CRITICAL: Missing required environment variable: ${key}`);
  }

  return value;
}
