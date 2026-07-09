import { DEFAULT_LOCALE, isLocale, type Locale } from '../i18n/config';

/**
 * Pure helpers for decoding a recipe entry id of the form
 * `<category>/<...slug>/<locale>` (e.g. "desserts/condensed-milk-flan/en").
 * Kept free of `astro:content` imports so they are unit-testable.
 */

/** The category is the first path segment of a recipe id. */
export function categoryOf(id: string): string {
  return id.split('/')[0] ?? '';
}

/** The locale is the last path segment of a recipe id. */
export function localeOf(id: string): Locale {
  const last = id.split('/').pop() ?? '';
  return isLocale(last) ? last : DEFAULT_LOCALE;
}

/**
 * The shared recipe key: the id without its trailing locale segment
 * (e.g. "desserts/flan/en" -> "desserts/flan"). Stable across locales and
 * doubles as the URL slug.
 */
export function recipeKeyOf(id: string): string {
  return id.split('/').slice(0, -1).join('/');
}
