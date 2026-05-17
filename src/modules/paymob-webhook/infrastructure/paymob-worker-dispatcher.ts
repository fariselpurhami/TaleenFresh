// src/modules/paymob-webhook/infrastructure/paymob-worker-dispatcher.ts

import { getRequiredEnvVar } from './env';

export interface PaymobWorkerDispatcher {
  triggerBackgroundWorker(transactionId: string): Promise<void>;
}

export class HttpPaymobWorkerDispatcher implements PaymobWorkerDispatcher {
  async triggerBackgroundWorker(transactionId: string): Promise<void> {
    try {
      const appUrl = getRequiredEnvVar('NEXT_PUBLIC_APP_URL');
      const workerToken = getRequiredEnvVar('WORKER_SECRET_TOKEN');
      const workerUrl = new URL('/api/webhooks/paymob/worker', appUrl);

      fetch(workerUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${workerToken}`,
        },
        body: JSON.stringify({ transactionId }),
        keepalive: true,
      }).catch((error: unknown) => {
        console.error(
          `[Paymob Webhook] Failed to trigger background worker for tx ${transactionId}:`,
          error,
        );
      });
    } catch (error) {
      console.error(
        `[Paymob Webhook] Error preparing background worker trigger for tx ${transactionId}:`,
        error,
      );
    }
  }
}
