// src/instrumentation.ts

import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('../sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('../sentry.edge.config');
    }
  } catch (error) {
    console.error('[Instrumentation] Failed to initialize Sentry configurations:', error);
  }
}

export const onRequestError = Sentry.captureRequestError;
