// src/app/api/webhooks/paymob/route.ts

import { after, NextResponse } from 'next/server';
import type { PaymobPayload } from '@/modules/paymob-webhook/domain/paymob-payload';
import {
  InvalidJsonPayloadError,
  InternalWebhookError,
  UnauthorizedWebhookError,
  UnprocessableWebhookError,
  UnsupportedMediaTypeError,
} from '@/modules/paymob-webhook/domain/paymob-webhook-errors';
import { IngestPaymobWebhookUseCase } from '@/modules/paymob-webhook/application/ingest-paymob-webhook';
import { SupabasePaymentEventsRepository } from '@/modules/paymob-webhook/infrastructure/payment-events-repository';
import { HttpPaymobWorkerDispatcher } from '@/modules/paymob-webhook/infrastructure/paymob-worker-dispatcher';

const ingestPaymobWebhookUseCase = new IngestPaymobWebhookUseCase(
  new SupabasePaymentEventsRepository(),
);

const paymobWorkerDispatcher = new HttpPaymobWorkerDispatcher();

function getReceivedHmac(req: Request): string {
  const url = new URL(req.url);
  return url.searchParams.get('hmac') || req.headers.get('hmac') || '';
}

function assertJsonContentType(req: Request): void {
  const contentType = req.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new UnsupportedMediaTypeError();
  }
}

async function parsePayload(req: Request): Promise<PaymobPayload> {
  try {
    return (await req.json()) as PaymobPayload;
  } catch {
    throw new InvalidJsonPayloadError();
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    assertJsonContentType(req);

    const payload = await parsePayload(req);
    const receivedHmac = getReceivedHmac(req);

    const result = await ingestPaymobWebhookUseCase.execute({
      payload,
      receivedHmac,
    });

    if (result.duplicate) {
      return NextResponse.json(
        { success: true, message: 'Duplicate acknowledged' },
        { status: 200 },
      );
    }

    after(() => {
      if (result.transactionId) {
        void paymobWorkerDispatcher.triggerBackgroundWorker(result.transactionId);
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof UnsupportedMediaTypeError) {
      return NextResponse.json({ error: error.message }, { status: 415 });
    }

    if (error instanceof InvalidJsonPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof UnauthorizedWebhookError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof UnprocessableWebhookError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    if (error instanceof InternalWebhookError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error('[Paymob Webhook] Unhandled exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
