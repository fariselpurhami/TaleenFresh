// src/proxy.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { envServer } from "@/lib/env-server";

let rateLimiterInstance: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
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
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: false,
    prefix: "talin-fresh:ratelimit",
  });

  return rateLimiterInstance;
}

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

    const secretKey = envServer.ADMIN_SECRET_TOKEN;

    if (!secretKey && pathname.startsWith('/admin')) {
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    const adminToken = req.cookies.get('taleen_admin_token')?.value;
    const isAuthenticated = Boolean(secretKey && adminToken === secretKey);

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
      const limiter = getRateLimiter();

      if (limiter) {
        const { success, limit, reset, remaining } = await limiter.limit(ip);

        if (!success) {
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
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware] Unhandled exception:", error);
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
