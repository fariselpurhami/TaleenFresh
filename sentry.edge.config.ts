// sentry.edge.config.ts

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: IS_PRODUCTION ? 0.05 : 1.0,
    enableLogs: true,
    sendDefaultPii: false,
    debug: false,
  });
} else {
  console.warn('CRITICAL: SENTRY_DSN is missing. Edge-side error tracking is disabled.');
}
