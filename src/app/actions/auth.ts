// src/app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';

export async function verifyAdminPin(formData: FormData) {
  const pin = formData.get('pin') as string;
  const SECRET_PIN = process.env.ADMIN_SECRET_PIN;

  if (!SECRET_PIN) {
    throw new Error('Server Configuration Error: PIN not set.');
  }

  if (pin === SECRET_PIN) {
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'taleen_admin_token',
      value: 'secure_access_2026',
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', 
      path: '/',
      maxAge: 2592000, // 30 يوماً
    });

    // نعيد إشارة للواجهة بالنجاح بدلاً من عمل Redirect من السيرفر
    return { success: true };
  }

  return { error: 'Invalid PIN' };
}
