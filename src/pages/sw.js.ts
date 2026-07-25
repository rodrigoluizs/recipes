import type { APIRoute } from 'astro';
import { LOCALES } from '../i18n/config';

export const prerender = true;

// Baked in at build time, so every deploy gets a fresh cache namespace and
// activate() below purges whatever the previous deploy had cached.
const CACHE_NAME = `recipes-cache-v${Date.now()}`;

// The feed is the one page a visitor expects to always be able to get back
// to (e.g. tapping "back" from a recipe) — precache it for both locales so
// that works offline even on a fresh install, not just after having
// visited it once already.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const PRECACHE_URLS = LOCALES.map((locale) => `${base}/${locale}/`);

const SOURCE = `
const CACHE_NAME = ${JSON.stringify(CACHE_NAME)};
const PRECACHE_URLS = ${JSON.stringify(PRECACHE_URLS)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}),
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

// Pages (HTML navigations) are network-first: always show the freshest
// content when online, only falling back to the last cached copy when the
// network fetch fails (offline). The \`?servings=\` scaling query is
// stripped from the cache key — it never changes the server-rendered HTML,
// so caching it separately would just make an older/newer copy show up
// depending on which scale factor you last had in the URL.
function pageCacheKey(request) {
  const url = new URL(request.url);
  url.search = '';
  return new Request(url.toString());
}

// Everything else (images, JS, CSS — all content-hashed by the build) is
// cache-first: once fetched, served instantly from cache on every later
// visit, since a changed file always gets a new hashed filename.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  const isPage = request.mode === 'navigate' || request.destination === 'document';

  if (isPage) {
    const key = pageCacheKey(request);
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(key, response.clone()));
          }
          return response;
        })
        .catch(() => caches.open(CACHE_NAME).then((cache) => cache.match(key))),
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
