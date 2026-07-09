/** Join a path onto the configured base path (handles the Pages subpath). */
const BASE = import.meta.env.BASE_URL; // e.g. "/recipes/"

export function href(path = ''): string {
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  if (!path) return base || '/';
  const rel = path.startsWith('/') ? path : `/${path}`;
  return `${base}${rel}`;
}

/**
 * Build a URL scoped to a locale: `localeHref('pt', 'desserts/flan')` ->
 * "/recipes/pt/desserts/flan". With no path it points at the locale's home.
 */
export function localeHref(locale: string, path = ''): string {
  return href(path ? `${locale}/${path}` : `${locale}`);
}
