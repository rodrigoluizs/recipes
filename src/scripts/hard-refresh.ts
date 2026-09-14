/**
 * Reload the page, dropping the service worker's caches first — but only when
 * we can confirm real connectivity. A stale hashed asset (e.g. a broken CSS
 * build pinned in the cache-first store) survives a plain reload; clearing the
 * cache forces a refetch.
 *
 * Offline we must NOT clear the cache: it holds the only copy we can render, so
 * wiping it would leave a blank page with no way to recover until reconnecting.
 * In that case we just reload (the SW serves the cached page).
 */
export async function hardRefresh(): Promise<void> {
  let online = navigator.onLine;

  if (online) {
    try {
      // HEAD bypasses the service worker (its fetch handler only touches GET),
      // so this genuinely hits the network rather than being served from cache.
      await fetch(`${location.origin}${location.pathname}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
    } catch {
      online = false; // navigator.onLine lied, or the network is down
    }
  }

  if (online && 'caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('recipes-cache-'))
          .map((key) => caches.delete(key)),
      );
    } catch {
      /* Cache API unavailable — fall through and reload anyway. */
    }
  }

  location.reload();
}
