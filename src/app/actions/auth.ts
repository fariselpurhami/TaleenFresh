// src/app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';

export async function verifyAdminPin(formData: FormData) {
  const pin = formData.get('pin') as string;
  const SECRET_PIN = process.env.ADMIN_SECRET_PIN;
  const SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN;

  // Architectural Rule: Fail Fast if Env variables are missing
  if (!SECRET_PIN || !SECRET_TOKEN) {
    console.error('[CRITICAL ERROR] Missing Admin Environment Variables.');
    throw new Error('Server Configuration Error: Security credentials not set.');
  }

  if (pin === SECRET_PIN) {
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'taleen_admin_token',
      value: SECRET_TOKEN, // Dynamic & Secure Token
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 2592000, // 30 Days
    });

    return { success: true };
  }

  return { error: 'Invalid PIN' };
}
