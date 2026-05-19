// src/lib/security/device-trust.ts

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const TRUST_COOKIE_NAME = '__Host-taleenfresh_device_trust';
export const TRUST_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;
export const TRUST_COOKIE_PATH = '/';

function toArrayBuffer(value: ArrayBufferLike): ArrayBuffer {
  if (value instanceof ArrayBuffer) {
    return value;
  }

  const view = new Uint8Array(value);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

function toExactArrayBuffer(view: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeToBytes(base64Url: string): Uint8Array {
  const normalized = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeBase64UrlToString(base64Url: string): string {
  return decoder.decode(toExactArrayBuffer(base64UrlDecodeToBytes(base64Url)));
}

function extractKeyVersion(secret: string): string {
  const [version] = secret.split(':');
  return version || 'v1';
}

async function importHmacKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toExactArrayBuffer(encoder.encode(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  );
}

export async function buildTrustedDeviceCookieValue(secret: string): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const keyVersion = extractKeyVersion(secret);
  const payload = `${keyVersion}.${issuedAt}`;
  const payloadBytes = encoder.encode(payload);
  const cryptoKey = await importHmacKey(secret, ['sign']);
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, toExactArrayBuffer(payloadBytes));
  const signatureBytes = new Uint8Array(toArrayBuffer(signatureBuffer));
  const encodedPayload = base64UrlEncodeBytes(payloadBytes);
  const encodedSignature = base64UrlEncodeBytes(signatureBytes);

  return `${encodedPayload}.${encodedSignature}`;
}

export async function verifyTrustedDeviceCookie(cookieValue: string, secret: string): Promise<boolean> {
  if (!cookieValue || !cookieValue.includes('.')) {
    return false;
  }

  const parts = cookieValue.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [encodedPayload, encodedSignature] = parts;
  if (!encodedPayload || !encodedSignature) {
    return false;
  }

  try {
    const payloadString = decodeBase64UrlToString(encodedPayload);
    const payloadBytes = encoder.encode(payloadString);
    const signatureBytes = base64UrlDecodeToBytes(encodedSignature);
    const cryptoKey = await importHmacKey(secret, ['verify']);
    const isValidSignature = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      toExactArrayBuffer(signatureBytes),
      toExactArrayBuffer(payloadBytes),
    );

    if (!isValidSignature) {
      return false;
    }

    const [payloadVersion, issuedAtRaw] = payloadString.split('.');
    if (!payloadVersion || !issuedAtRaw) {
      return false;
    }

    const issuedAt = Number.parseInt(issuedAtRaw, 10);
    if (!Number.isFinite(issuedAt)) {
      return false;
    }

    const currentVersion = extractKeyVersion(secret);
    if (payloadVersion !== currentVersion) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (issuedAt > nowInSeconds) {
      return false;
    }

    if (nowInSeconds - issuedAt > TRUST_COOKIE_TTL_SECONDS) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
