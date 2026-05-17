// src/modules/paymob-webhook/application/ingest-paymob-webhook.ts

import { verifyPaymobHmac } from '../domain/paymob-hmac';
import { getTransactionIdFromPayload, type PaymobPayload } from '../domain/paymob-payload';
import {
  InternalWebhookError,
  UnauthorizedWebhookError,
  UnprocessableWebhookError,
} from '../domain/paymob-webhook-errors';
import type { PaymentEventsRepository } from '../infrastructure/payment-events-repository';

export interface IngestPaymobWebhookCommand {
  readonly payload: PaymobPayload;
  readonly receivedHmac: string;
}

export interface IngestPaymobWebhookResult {
  readonly transactionId: string | null;
  readonly duplicate: boolean;
}

export class IngestPaymobWebhookUseCase {
  constructor(private readonly paymentEventsRepository: PaymentEventsRepository) {}

  async execute(
    command: IngestPaymobWebhookCommand,
  ): Promise<IngestPaymobWebhookResult> {
    const { payload, receivedHmac } = command;

    if (!receivedHmac || typeof receivedHmac !== 'string' || !verifyPaymobHmac(payload, receivedHmac)) {
      console.warn('[Paymob Webhook] Unauthorized attempt: Invalid or missing HMAC.');
      throw new UnauthorizedWebhookError();
    }

    const transactionId = getTransactionIdFromPayload(payload);

    if (!transactionId) {
      console.error('[Paymob Webhook] Invalid payload structure: Missing transaction ID.');
      throw new UnprocessableWebhookError();
    }

    const { duplicate, error } = await this.paymentEventsRepository.insertPendingEvent({
      transaction_id: transactionId,
      payload,
      status: 'pending',
      retry_count: 0,
    });

    if (duplicate) {
      console.info(`[Paymob Webhook] Duplicate transaction ID ignored: ${transactionId}`);
      return {
        transactionId,
        duplicate: true,
      };
    }

    if (error) {
      console.error(
        `[Paymob Webhook] Database insert failed for tx ${transactionId}:`,
        error,
      );
      throw new InternalWebhookError();
    }

    return {
      transactionId,
      duplicate: false,
    };
  }
}
