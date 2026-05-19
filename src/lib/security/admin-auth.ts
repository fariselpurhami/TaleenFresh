// src/lib/security/admin-auth.ts

import { safeEqual } from '@/lib/security/safe-compare';

export const ADMIN_TOKEN_COOKIE_NAME = 'taleen_admin_token';

export async function isAdminTokenAuthenticated(
  adminToken: string | undefined,
  secretToken: string,
): Promise<boolean> {
  if (!adminToken || !secretToken) {
    return false;
  }

  return safeEqual(adminToken, secretToken);
}
