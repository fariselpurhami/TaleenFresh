// src/app/api/admin/realtime-token/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt, { type SignOptions } from 'jsonwebtoken';
import {
  ADMIN_TOKEN_COOKIE_NAME,
  isAdminTokenAuthenticated,
} from '@/lib/security/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type AdminAuthResult = {
  readonly authorized: boolean;
  readonly subject: string | null;
};

const REALTIME_TOKEN_TTL_SECONDS = 5 * 60;
const REALTIME_TOKEN_ISSUER = 'supabase';
const REALTIME_TOKEN_AUDIENCE = 'authenticated';
const REALTIME_TOKEN_ROLE = 'authenticated';
const REALTIME_TOKEN_APP_ROLE = 'dashboard_admin';

function createNoStoreJsonResponse(
  body: Record<string, unknown>,
  status: number
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
      Vary: 'Cookie',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function getEnvValue(name: 'ADMIN_SECRET_TOKEN' | 'SUPABASE_JWT_SECRET'): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`MISSING_ENV_${name}`);
  }

  return value;
}

async function checkAdminAuth(): Promise<AdminAuthResult> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_TOKEN_COOKIE_NAME);

  if (!adminCookie?.value) {
    return {
      authorized: false,
      subject: null,
    };
  }

  const secretToken = getEnvValue('ADMIN_SECRET_TOKEN');
  const authorized = await isAdminTokenAuthenticated(adminCookie.value, secretToken);

  if (!authorized) {
    return {
      authorized: false,
      subject: null,
    };
  }

  return {
    authorized: true,
    subject: crypto.randomUUID(),
  };
}

function issueRealtimeToken(subject: string): string {
  const secret = getEnvValue('SUPABASE_JWT_SECRET');
  const signOptions: SignOptions = {
    algorithm: 'HS256',
    expiresIn: REALTIME_TOKEN_TTL_SECONDS,
  };

  return jwt.sign(
    {
      sub: subject,
      role: REALTIME_TOKEN_ROLE,
      app_role: REALTIME_TOKEN_APP_ROLE,
      iss: REALTIME_TOKEN_ISSUER,
      aud: REALTIME_TOKEN_AUDIENCE,
    },
    secret,
    signOptions
  );
}

export async function GET(): Promise<NextResponse> {
  try {
    const auth = await checkAdminAuth();

    if (!auth.authorized || !auth.subject) {
      return createNoStoreJsonResponse({ error: 'Unauthorized' }, 401);
    }

    const token = issueRealtimeToken(auth.subject);

    return createNoStoreJsonResponse(
      {
        token,
        expiresIn: REALTIME_TOKEN_TTL_SECONDS,
      },
      200
    );
  } catch {
    return createNoStoreJsonResponse({ error: 'Internal Server Error' }, 500);
  }
}
