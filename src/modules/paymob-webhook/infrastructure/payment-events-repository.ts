// src/modules/paymob-webhook/infrastructure/payment-events-repository.ts

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getRequiredEnvVar } from './env';
import type { PaymobPayload } from '../domain/paymob-payload';

interface PaymentEventInsertRecord {
  readonly transaction_id: string;
  readonly payload: PaymobPayload;
  readonly status: 'pending';
  readonly retry_count: 0;
}

export interface PaymentEventsRepository {
  insertPendingEvent(record: PaymentEventInsertRecord): Promise<{
    readonly duplicate: boolean;
    readonly error: unknown | null;
  }>;
}

function getSupabaseAdminClient(): SupabaseClient {
  return createClient(
    getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export class SupabasePaymentEventsRepository implements PaymentEventsRepository {
  private readonly supabaseAdmin: SupabaseClient;

  constructor(supabaseAdmin?: SupabaseClient) {
    this.supabaseAdmin = supabaseAdmin ?? getSupabaseAdminClient();
  }

  async insertPendingEvent(record: PaymentEventInsertRecord): Promise<{
    readonly duplicate: boolean;
    readonly error: unknown | null;
  }> {
    const { error } = await this.supabaseAdmin.from('payment_events').insert(record);

    if (error) {
      const possibleCode =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code?: unknown }).code === 'string'
          ? (error as { code: string }).code
          : null;

      if (possibleCode === '23505') {
        return { duplicate: true, error };
      }

      return { duplicate: false, error };
    }

    return { duplicate: false, error: null };
  }
}
