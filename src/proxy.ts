// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  // 1. حاجز الأداء (Performance Barrier)
  if (path.startsWith('/_next') || path.includes('.')) {
    return NextResponse.next();
  }

  // 2. إغلاق الثغرة الأمنية (Strict Security Check)
  const SECRET_KEY = process.env.ADMIN_SECRET_TOKEN;
  
  if (!SECRET_KEY) {
    console.error('CRITICAL ARCHITECTURAL ERROR: ADMIN_SECRET_TOKEN is missing!');
    // نمنع الدخول تماماً إذا نسيت وضع المتغير في الـ Environment
    if (path.startsWith('/admin')) {
      return new NextResponse('Internal Server Error: Security Misconfiguration', { status: 500 });
    }
  }

  // استخراج الكوكي بأمان
  const adminToken = req.cookies.get('taleen_admin_token')?.value;
  const isAuthenticated = adminToken && adminToken === SECRET_KEY;

  const isLoginRoute = path === '/admin-login';
  const isAdminRoute = path.startsWith('/admin') && !isLoginRoute;

  // 3. بروتوكول الطرد (Bouncer Logic)
  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = new URL('/admin-login', req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('taleen_admin_token'); // تنظيف أمني
    return response;
  }

  // 4. منع الازدواجية
  if (isLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin-login'],
};
