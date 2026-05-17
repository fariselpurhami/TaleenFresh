// src/modules/paymob-webhook/domain/paymob-payload.ts

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  readonly [key: string]: JsonValue | undefined;
}

export interface PaymobPayload extends JsonObject {
  readonly obj?: JsonObject;
}

export const PAYMOB_HMAC_KEYS: readonly string[] = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
] as const;

export function extractNestedValue(
  obj: JsonObject,
  path: string,
): JsonValue | undefined {
  return path.split('.').reduce<JsonValue | undefined>((acc, part) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as JsonObject)[part];
    }

    return undefined;
  }, obj);
}

export function getTransactionIdFromPayload(payload: PaymobPayload): string | null {
  if (!payload.obj) {
    return null;
  }

  const transactionId = payload.obj.id;
  if (typeof transactionId === 'undefined' || transactionId === null) {
    return null;
  }

  return String(transactionId);
}
