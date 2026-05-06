// src/proxy.ts    

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "talin-fresh:ratelimit",
});

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  if (path.startsWith('/_next') || path.includes('.')) {
    return NextResponse.next();
  }

  const SECRET_KEY = process.env.ADMIN_SECRET_TOKEN;

  if (!SECRET_KEY) {
    console.error('CRITICAL ARCHITECTURAL ERROR: ADMIN_SECRET_TOKEN is missing!');
    if (path.startsWith('/admin')) {
      return new NextResponse('Internal Server Error: Security Misconfiguration', { status: 500 });
    }
  }

  const adminToken = req.cookies.get('taleen_admin_token')?.value;
  const isAuthenticated = adminToken && adminToken === SECRET_KEY;

  const isLoginRoute = path === '/admin-login';
  const isAdminRoute = path.startsWith('/admin') && !isLoginRoute;

  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = new URL('/admin-login', req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('taleen_admin_token');
    return response;
  }

  if (isLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  if (path.startsWith('/api/') || path.includes('/actions/')) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please wait." }),
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
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin-login',
    '/api/:path*',
    '/actions/:path*'
  ],
};
