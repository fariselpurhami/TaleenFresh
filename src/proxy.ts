// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server';

// التعديل المعماري هنا: تغيير اسم الدالة الأساسية لـ proxy
export function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // 1. حاجز الأداء (Performance Barrier): 
  if (url.pathname.startsWith('/_next') || url.pathname.includes('.')) {
    return NextResponse.next();
  }

  // 2. حماية مسارات الإدارة (Admin Route Guard)
  if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login')) {
    
    // استخراج الكوكي بأمان
    const adminToken = req.cookies.get('taleen_admin_token')?.value;

    // 3. الأمان المتقدم (Environment Variables)
    const SECRET_KEY = process.env.ADMIN_SECRET_TOKEN || 'secure_access_2026';

    // 4. بروتوكول الطرد (Bouncer Logic):
    if (!adminToken || adminToken !== SECRET_KEY) {
      const loginUrl = new URL('/admin/login', req.url);
      const response = NextResponse.redirect(loginUrl);
      
      // ضربة استباقية: تنظيف أي كوكيز مضروبة
      response.cookies.delete('taleen_admin_token');
      
      return response;
    }
  }

  // السماح بالمرور للطلبات السليمة
  return NextResponse.next();
}

// 5. رادار التفتيش (Edge Matcher)
export const config = {
  matcher: ['/admin/:path*'],
};
