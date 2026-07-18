/* OOO "MUSFIRA SAVDO TRANS" PWA — installability only. No offline cache. */
const SW_VERSION = "musfira-pwa-v7";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        client.postMessage({ type: "SW_ACTIVATED", version: SW_VERSION });
      }
    })(),
  );
});

/**
 * Fetch handler is required for Chromium installability.
 * Do NOT call respondWith — browser uses normal network (no caching).
 */
self.addEventListener("fetch", () => {
  // network-only by default
});

void SW_VERSION;
