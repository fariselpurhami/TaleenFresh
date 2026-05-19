// src/lib/security/safe-compare.ts

const encoder = new TextEncoder();

function toArrayBuffer(value: ArrayBufferLike): ArrayBuffer {
  if (value instanceof ArrayBuffer) {
    return value;
  }

  const view = new Uint8Array(value);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

export async function safeEqual(provided: string, secret: string): Promise<boolean> {
  const [providedHash, secretHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(secret)),
  ]);

  const providedBytes = new Uint8Array(toArrayBuffer(providedHash));
  const secretBytes = new Uint8Array(toArrayBuffer(secretHash));

  if (providedBytes.length !== secretBytes.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < providedBytes.length; index += 1) {
    mismatch |= providedBytes[index] ^ secretBytes[index];
  }

  return mismatch === 0;
}
