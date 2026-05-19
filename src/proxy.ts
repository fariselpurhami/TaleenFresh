// src/proxy.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { envServer } from '@/lib/env-server';
import { getClientIp, getRateLimiter } from '@/lib/infrastructure/rate-limit';
import { isAdminTokenAuthenticated, ADMIN_TOKEN_COOKIE_NAME } from '@/lib/security/admin-auth';
import { verifyTrustedDeviceCookie, TRUST_COOKIE_NAME } from '@/lib/security/device-trust';

const ADMIN_PROVISIONING_KEY = process.env.ADMIN_PROVISIONING_KEY || envServer.ADMIN_PROVISIONING_KEY || '';

function buildInternalServerErrorResponse(message: string): NextResponse {
  return new NextResponse(message, { status: 500 });
}

function isStaticAssetPath(pathname: string): boolean {
  return pathname.startsWith('/_next') || pathname.includes('.');
}

function buildRootRedirect(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/', request.url));
}

function buildAdminLoginRedirect(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/admin-login', request.url));
}

function buildAdminRedirect(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/admin', request.url));
}

function buildRateLimitedResponse(limit: number, remaining: number, reset: number): NextResponse {
  const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));

  return new NextResponse(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': retryAfterSeconds.toString(),
      },
    },
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  try {
    const { pathname } = request.nextUrl;

    if (isStaticAssetPath(pathname)) {
      return NextResponse.next();
    }

    const isLoginRoute = pathname === '/admin-login';
    const isAdminRoute = pathname.startsWith('/admin') && !isLoginRoute;
    const isProtectedAdminSurface = isAdminRoute || isLoginRoute;

    if (isProtectedAdminSurface) {
      if (!ADMIN_PROVISIONING_KEY) {
        return buildInternalServerErrorResponse('Internal Server Error: Missing Provisioning Key');
      }

      const trustCookie = request.cookies.get(TRUST_COOKIE_NAME);

      if (!trustCookie?.value) {
        return buildRootRedirect(request);
      }

      const isTrustedDevice = await verifyTrustedDeviceCookie(trustCookie.value, ADMIN_PROVISIONING_KEY);

      if (!isTrustedDevice) {
        const response = buildRootRedirect(request);
        response.cookies.delete(TRUST_COOKIE_NAME);
        return response;
      }
    }

    if (isProtectedAdminSurface) {
      const secretKey = envServer.ADMIN_SECRET_TOKEN;

      if (!secretKey) {
        return buildInternalServerErrorResponse('Internal Server Error: Missing Secret Token');
      }

      const adminToken = request.cookies.get(ADMIN_TOKEN_COOKIE_NAME)?.value;
      const isAuthenticated = await isAdminTokenAuthenticated(adminToken, secretKey);

      if (isAdminRoute && !isAuthenticated) {
        const response = buildAdminLoginRedirect(request);
        response.cookies.delete(ADMIN_TOKEN_COOKIE_NAME);
        return response;
      }

      if (isLoginRoute && isAuthenticated) {
        return buildAdminRedirect(request);
      }
    }

    if (pathname.startsWith('/api/')) {
      const limiter = getRateLimiter();

      if (limiter) {
        const ip = getClientIp(request);
        const { success, limit, reset, remaining } = await limiter.limit(ip);

        if (!success) {
          return buildRateLimitedResponse(limit, remaining, reset);
        }

        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        return response;
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('[Proxy] Unhandled exception:', error);
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
