// src/modules/paymob-webhook/domain/paymob-hmac.ts

import crypto from 'node:crypto';
import { getRequiredEnvVar } from '../infrastructure/env';
import {
  extractNestedValue,
  PAYMOB_HMAC_KEYS,
  PaymobPayload,
} from './paymob-payload';

export function verifyPaymobHmac(
  payload: PaymobPayload,
  receivedHmac: string,
): boolean {
  if (!payload || typeof payload !== 'object' || !payload.obj) {
    return false;
  }

  const hmacSecret = getRequiredEnvVar('PAYMOB_HMAC_SECRET');

  const dataString = PAYMOB_HMAC_KEYS.map((key) => {
    const value = extractNestedValue(payload.obj!, key);

    if (typeof value === 'boolean') {
      return value.toString();
    }

    return value === undefined || value === null ? '' : String(value);
  }).join('');

  const calculatedHmac = crypto
    .createHmac('sha512', hmacSecret)
    .update(dataString)
    .digest('hex');

  try {
    const calculatedBuffer = Buffer.from(calculatedHmac, 'utf8');
    const receivedBuffer = Buffer.from(receivedHmac, 'utf8');

    if (calculatedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(calculatedBuffer, receivedBuffer);
  } catch (error) {
    console.error('[Paymob Webhook] Error during HMAC comparison', error);
    return false;
  }
}
