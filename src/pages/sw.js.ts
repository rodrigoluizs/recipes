import type { APIRoute } from 'astro';

export const prerender = true;

// Baked in at build time, so every deploy gets a fresh cache namespace and
// activate() below purges whatever the previous deploy had cached. This is safe
// for offline use because install() precaches the *entire* site (every page and
// every asset it references), so the new cache is fully populated before the old
// one is dropped.
const CACHE_NAME = `recipes-cache-v${Date.now()}`;

// PRECACHE_URLS is a placeholder filled in after the build by
// scripts/precache-manifest.mjs: it parses the generated HTML and lists every
// page plus every same-origin asset each page references (CSS, JS, images,
// icons). Doing it post-build guarantees the precache never drifts from what the
// pages actually request — the whole reason an offline page could otherwise load
// unstyled (its hashed CSS/JS bundle wasn't cached).
const SOURCE = `
const CACHE_NAME = ${JSON.stringify(CACHE_NAME)};
const PRECACHE_URLS = [/*PRECACHE_MANIFEST*/];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Cache each URL independently so one missing asset can't abort the whole
      // precache (unlike cache.addAll, which is all-or-nothing).
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))),
    ),
  );
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

// Canonical cache key for a page (HTML navigation). Two normalisations:
//  - Drop the \`?servings=\` scaling query — it never changes the server-rendered
//    HTML, so caching per scale factor would just serve stale copies.
//  - Force a trailing slash. GitHub Pages serves \`/x/\` as 200 but 301-redirects
//    \`/x\` -> \`/x/\`; the site links to the slashless form. Keying (and fetching)
//    the slash form keeps both the precache and the runtime cache on the clean
//    200 — Safari refuses to serve a *redirected* response to a navigation
//    ("Response served by service worker has redirections").
function pageCacheKey(request) {
  const url = new URL(request.url);
  url.search = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return new Request(url.toString());
}

// Belt-and-suspenders: if a page response ever did go through a redirect, hand
// back a fresh non-redirected copy so the navigation doesn't get rejected.
async function cleanPageResponse(response) {
  if (!response || !response.redirected) return response;
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

// Pages are network-first: freshest content when online, cached copy when the
// network fails (offline). Both fetch and lookup use the slash-normalised key.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  const isPage = request.mode === 'navigate' || request.destination === 'document';

  if (isPage) {
    const key = pageCacheKey(request);
    event.respondWith(
      fetch(key)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(key, response.clone());
          }
          return cleanPageResponse(response);
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cleanPageResponse(await cache.match(key))) || Response.error();
        }),
    );
    return;
  }

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
