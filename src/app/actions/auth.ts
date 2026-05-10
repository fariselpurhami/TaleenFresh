// src/app/actions/auth.ts

'use server';

import { cookies } from 'next/headers';
import crypto from 'node:crypto';

const ADMIN_SECRET_PIN = process.env.ADMIN_SECRET_PIN;
const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!ADMIN_SECRET_PIN || !ADMIN_SECRET_TOKEN) {
  throw new Error('CRITICAL: Server configuration error. Admin security credentials are not set.');
}

const ADMIN_COOKIE_NAME = 'taleen_admin_token';
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

export type AdminAuthResult =
  | { readonly success: true; readonly error?: never }
  | { readonly success: false; readonly error: string };

function secureCompare(input: string, secret: string): boolean {
  const inputBuffer = Buffer.from(input, 'utf8');
  const secretBuffer = Buffer.from(secret, 'utf8');

  if (inputBuffer.length !== secretBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, secretBuffer);
}

export async function verifyAdminPin(formData: FormData): Promise<AdminAuthResult> {
  try {
    const rawPin = formData.get('pin');

    if (typeof rawPin !== 'string' || rawPin.trim() === '') {
      return { success: false, error: 'Invalid PIN format' };
    }

    const pin = rawPin.trim();

    if (secureCompare(pin, ADMIN_SECRET_PIN as string)) {
      const cookieStore = await cookies();

      cookieStore.set({
        name: ADMIN_COOKIE_NAME,
        value: ADMIN_SECRET_TOKEN as string,
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'strict',
        path: '/',
        maxAge: THIRTY_DAYS_IN_SECONDS,
      });

      return { success: true };
    }

    console.warn('[Admin Auth] Failed login attempt: Incorrect PIN provided.');
    return { success: false, error: 'Invalid PIN' };

  } catch (error) {
    console.error('[Admin Auth] Exception during PIN verification:', error);
    return { success: false, error: 'Internal authentication error' };
  }
}
