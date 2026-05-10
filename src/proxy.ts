// src/proxy.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
  throw new Error("CRITICAL: Missing Redis environment variables for rate limiting.");
}

const redisClient = new Redis({
  url: REDIS_URL,
  token: REDIS_TOKEN,
});

const rateLimiter = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: false,
  prefix: "talin-fresh:ratelimit",
});

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  if (realIp) {
    return realIp.trim();
  }
  
  return "127.0.0.1";
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  try {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith('/_next') || pathname.includes('.')) {
      return NextResponse.next();
    }

    const SECRET_KEY = process.env.ADMIN_SECRET_TOKEN;
    if (!SECRET_KEY) {
      console.error('[Middleware] CRITICAL ARCHITECTURAL ERROR: ADMIN_SECRET_TOKEN is missing.');
      if (pathname.startsWith('/admin')) {
        return new NextResponse('Internal Server Error: Security Misconfiguration', { status: 500 });
      }
    }

    const adminToken = req.cookies.get('taleen_admin_token')?.value;
    const isAuthenticated = Boolean(SECRET_KEY && adminToken === SECRET_KEY);

    const isLoginRoute = pathname === '/admin-login';
    const isAdminRoute = pathname.startsWith('/admin') && !isLoginRoute;

    if (isAdminRoute && !isAuthenticated) {
      const loginUrl = new URL('/admin-login', req.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('taleen_admin_token');
      return response;
    }

    if (isLoginRoute && isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    if (pathname.startsWith('/api/')) {
      const ip = getClientIp(req);
      const { success, limit, reset, remaining } = await rateLimiter.limit(ip);

      if (!success) {
        console.warn(`[Middleware] Rate limit exceeded for IP: ${ip} on path: ${pathname}`);

        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
              "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      const apiResponse = NextResponse.next();
      apiResponse.headers.set("X-RateLimit-Limit", limit.toString());
      apiResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
      return apiResponse;
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware] Unhandled exception during request routing:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin-login',
    '/api/:path*',
  ],
};
