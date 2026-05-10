// src/app/sw.ts

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  Serwist,
  StaleWhileRevalidate,
  NetworkOnly,
  ExpirationPlugin,
  BackgroundSyncPlugin,
  CacheFirst,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const CACHE_CONFIG = {
  PRODUCTS: {
    NAME: "products-data-cache-v1",
    MAX_ENTRIES: 100,
    MAX_AGE_SECONDS: 86400,
  },
  IMAGES: {
    NAME: "supabase-images-cache-v1",
    MAX_ENTRIES: 300,
    MAX_AGE_SECONDS: 604800,
  },
  ORDERS: {
    QUEUE_NAME: "taleenfresh-orders-queue",
    MAX_RETENTION_MINUTES: 2880,
  },
} as const;

const bgSyncPlugin = new BackgroundSyncPlugin(CACHE_CONFIG.ORDERS.QUEUE_NAME, {
  maxRetentionTime: CACHE_CONFIG.ORDERS.MAX_RETENTION_MINUTES,
  onSync: async ({ queue }) => {
    let entry;

    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
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
      matcher: ({ request, url }) =>
        request.method === "GET" && url.pathname.includes("/rest/v1/products"),
      handler: new StaleWhileRevalidate({
        cacheName: CACHE_CONFIG.PRODUCTS.NAME,
        plugins: [
          new ExpirationPlugin({
            maxEntries: CACHE_CONFIG.PRODUCTS.MAX_ENTRIES,
            maxAgeSeconds: CACHE_CONFIG.PRODUCTS.MAX_AGE_SECONDS,
          }),
        ],
      }),
    },
    {
      matcher: ({ request, url }) =>
        request.method === "POST" && url.pathname.includes("/rest/v1/orders"),
      handler: new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
    },
    {
      matcher: ({ request, url }) =>
        request.destination === "image" && url.hostname.includes("supabase.co"),
      handler: new CacheFirst({
        cacheName: CACHE_CONFIG.IMAGES.NAME,
        plugins: [
          new ExpirationPlugin({
            maxEntries: CACHE_CONFIG.IMAGES.MAX_ENTRIES,
            maxAgeSeconds: CACHE_CONFIG.IMAGES.MAX_AGE_SECONDS,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
