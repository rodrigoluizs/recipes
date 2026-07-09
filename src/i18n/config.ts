/**
 * Supported locales. `en` is the default (used when detection is ambiguous and
 * as the fallback for any missing UI string). Adding a locale here is the first
 * step to supporting it; the UI dictionary in `ui.ts` must then be extended.
 */
export const LOCALES = ['en', 'pt'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Short labels shown in the language toggle. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  pt: 'PT',
};

/** Type guard for narrowing an arbitrary string to a supported Locale. */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
