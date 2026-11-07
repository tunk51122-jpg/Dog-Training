/* PawMaster Pro service worker — works from both / and /<repo>/ on GitHub Pages. */
const CACHE_NAME = 'pawmaster-pro-v2';
const APP_ROOT = new URL('./', self.registration.scope);
const CORE_ASSETS = [
  APP_ROOT.href,
  new URL('index.html', APP_ROOT).href,
  new URL('manifest.webmanifest', APP_ROOT).href,
  new URL('paw-icon.svg', APP_ROOT).href,
  new URL('paw-icon-192.png', APP_ROOT).href,
  new URL('paw-icon-512.png', APP_ROOT).href,
  new URL('apple-touch-icon.png', APP_ROOT).href,
  new URL('pawmaster-puppy.jpg', APP_ROOT).href,
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // One missing optional asset should not prevent the service worker installing.
    await Promise.all(CORE_ASSETS.map(async (asset) => {
      try {
        await cache.add(asset);
      } catch {
        // The browser can fetch it later when the network is available.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith('pawmaster-pro-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (!requestUrl.pathname.startsWith(APP_ROOT.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Navigation: try the latest page first; use the cached app shell offline.
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await cache.match(request)) ||
          (await cache.match(new URL('index.html', APP_ROOT).href)) ||
          Response.error();
      }
    }

    // Static resources: cache-first, then refresh the cache from the network.
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response && response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return Response.error();
    }
  })());
});
