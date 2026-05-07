// src/app/sw.ts

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { 
  Serwist, 
  StaleWhileRevalidate, 
  NetworkOnly, 
  ExpirationPlugin, 
  BackgroundSyncPlugin,
  CacheFirst 
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const bgSyncPlugin = new BackgroundSyncPlugin('taleenfresh-orders-queue', {
  maxRetentionTime: 48 * 60, 
  onSync: async ({ queue }) => {
    console.log('[Service Worker] Network is back! Replaying orders queue...');
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('[Service Worker] Offline order sent successfully!');
      } catch (error) {
        console.error('[Service Worker] Failed to replay order, putting it back in queue.', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, url }) => request.method === 'GET' && url.pathname.includes('/rest/v1/products'),
      handler: new StaleWhileRevalidate({
        cacheName: 'products-data-cache-v1',
        plugins: [
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }),
        ],
      }),
    },
    {
      matcher: ({ request, url }) => request.method === 'POST' && url.pathname.includes('/rest/v1/orders'),
      handler: new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
    },
    {
      matcher: ({ request, url }) => request.destination === 'image' && url.hostname.includes('supabase.co'),
      handler: new CacheFirst({
        cacheName: 'supabase-images-cache-v1',
        plugins: [
          new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
