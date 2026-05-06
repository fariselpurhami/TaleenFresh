// src/app/sw.ts

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, StaleWhileRevalidate, NetworkOnly, ExpirationPlugin, BackgroundSyncPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const bgSyncPlugin = new BackgroundSyncPlugin('checkout-queue', {
  maxRetentionTime: 24 * 60,
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, url }) => {
        return request.method === 'GET' && url.pathname.includes('/rest/v1/products');
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'supabase-products-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60,
          }),
        ],
      }),
    },
    {
      matcher: ({ request, url }) => {
        return request.method === 'POST' && url.pathname.includes('/api/checkout');
      },
      handler: new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
