// src/lib/security/safe-compare.ts

const encoder = new TextEncoder();

export async function safeEqual(provided: string, secret: string): Promise<boolean> {
  const [providedHash, secretHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(secret)),
  ]);

  const providedBytes = new Uint8Array(providedHash);
  const secretBytes = new Uint8Array(secretHash);

  if (providedBytes.length !== secretBytes.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < providedBytes.length; index += 1) {
    mismatch |= providedBytes[index] ^ secretBytes[index];
  }

  return mismatch === 0;
}
