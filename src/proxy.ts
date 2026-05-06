// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin-login'],
};
