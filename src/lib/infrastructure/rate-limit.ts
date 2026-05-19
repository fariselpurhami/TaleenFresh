// src/lib/infrastructure/rate-limit.ts

import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { envServer } from '@/lib/env-server';

let rateLimiterInstance: Ratelimit | null = null;

export function getRateLimiter(): Ratelimit | null {
  if (rateLimiterInstance) {
    return rateLimiterInstance;
  }

  if (!envServer.UPSTASH_REDIS_REST_URL || !envServer.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const redisClient = new Redis({
    url: envServer.UPSTASH_REDIS_REST_URL,
    token: envServer.UPSTASH_REDIS_REST_TOKEN,
  });

  rateLimiterInstance = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: false,
    prefix: 'talin-fresh:ratelimit',
  });

  return rateLimiterInstance;
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || '127.0.0.1';
  }

  if (realIp) {
    return realIp.trim();
  }

  return '127.0.0.1';
}
