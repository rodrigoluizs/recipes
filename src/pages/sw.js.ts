import type { APIRoute } from 'astro';

export const prerender = true;

// Baked in at build time, so every deploy gets a fresh cache namespace and
// activate() below purges whatever the previous deploy had cached.
const CACHE_NAME = `recipes-cache-v${Date.now()}`;

const SOURCE = `
const CACHE_NAME = ${JSON.stringify(CACHE_NAME)};

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('recipes-cache-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Cache-first: once a URL has been fetched, it's served instantly from
// cache on every later visit — until the next deploy rotates CACHE_NAME.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }),
  );
});
`;

export const GET: APIRoute = () => {
  return new Response(SOURCE, {
    headers: { 'Content-Type': 'application/javascript' },
  });
};
