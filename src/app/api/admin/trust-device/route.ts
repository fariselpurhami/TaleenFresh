// src/app/api/admin/trust-device/route.ts

import { NextResponse } from 'next/server';
import { envServer } from '@/lib/env-server';
import { buildTrustedDeviceCookieValue, TRUST_COOKIE_NAME, TRUST_COOKIE_PATH, TRUST_COOKIE_TTL_SECONDS } from '@/lib/security/device-trust';
import { applyNoStoreHeaders } from '@/lib/security/headers';
import { safeEqual } from '@/lib/security/safe-compare';

const PROVISIONING_PARAM = 'key';
const REDIRECT_ON_SUCCESS = '/admin-login';
const REDIRECT_ON_FAILURE = '/';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const providedKey = url.searchParams.get(PROVISIONING_PARAM);
  const actualSecret = envServer.ADMIN_PROVISIONING_KEY;

  if (!providedKey || !(await safeEqual(providedKey, actualSecret))) {
    return applyNoStoreHeaders(
      NextResponse.redirect(new URL(REDIRECT_ON_FAILURE, url)),
    );
  }

  const trustedDeviceValue = await buildTrustedDeviceCookieValue(actualSecret);
  const response = NextResponse.redirect(new URL(REDIRECT_ON_SUCCESS, url));

  response.cookies.set({
    name: TRUST_COOKIE_NAME,
    value: trustedDeviceValue,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: TRUST_COOKIE_PATH,
    maxAge: TRUST_COOKIE_TTL_SECONDS,
  });

  return applyNoStoreHeaders(response);
}
