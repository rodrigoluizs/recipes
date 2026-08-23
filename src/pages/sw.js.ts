import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';
import { LOCALES } from '../i18n/config';
import { localeOf, recipeKeyOf } from '../lib/recipes';
import { ALL_IMAGE_WIDTHS } from '../lib/image-sizes';

export const prerender = true;

// Baked in at build time, so every deploy gets a fresh cache namespace and
// activate() below purges whatever the previous deploy had cached. This is
// safe for offline use because install() re-precaches *every* recipe (see
// below), so the new cache is fully populated before the old one is dropped.
const CACHE_NAME = `recipes-cache-v${Date.now()}`;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Everything worth having offline, computed at build time: the app shell (root
 * redirect + both locale feeds), every recipe page in every locale, and each
 * recipe's optimised hero image (all srcset variants). Precaching the full set
 * on install means any recipe opens offline right after installing/updating the
 * PWA — no need to have visited it first, and unaffected by the deploy purge.
 */
async function precacheUrls(): Promise<string[]> {
  const urls = new Set<string>([`${base}/`]);
  for (const locale of LOCALES) urls.add(`${base}/${locale}/`);

  const recipes = await getCollection('recipes');
  const seenImages = new Set<string>();

  for (const recipe of recipes) {
    urls.add(`${base}/${localeOf(recipe.id)}/${recipeKeyOf(recipe.id)}`);

    // Images are shared across locales, so optimise each source once. Generate
    // every width set the site renders (card thumbnail + detail hero) so the
    // emitted URLs match exactly what the feed and recipe pages request.
    const image = recipe.data.image;
    if (image && !seenImages.has(image.src)) {
      seenImages.add(image.src);
      for (const widths of ALL_IMAGE_WIDTHS) {
        try {
          const optimized = await getImage({ src: image, widths });
          urls.add(optimized.src);
          for (const variant of optimized.srcSet.values) urls.add(variant.url);
        } catch {
          /* optimisation failed — skip; the page itself is still cached */
        }
      }
    }
  }

  return [...urls];
}

const SOURCE = (precacheUrls: string[]) => `
const CACHE_NAME = ${JSON.stringify(CACHE_NAME)};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};

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

export const GET: APIRoute = async () => {
  return new Response(SOURCE(await precacheUrls()), {
    headers: { 'Content-Type': 'application/javascript' },
  });
};
