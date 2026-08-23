/**
 * Responsive image widths, in one place so the components that render an image
 * and the service worker that precaches it stay in lockstep. If these ever
 * diverge, the SW would precache URLs the pages never request (and miss the
 * ones they do), silently breaking offline photos — so both sides import here.
 */

/** Recipe card thumbnails on the feed (`RecipeCard.astro`). */
export const CARD_WIDTHS = [320, 640];

/** Full-bleed hero on the recipe detail page (`[locale]/[...slug].astro`). */
export const HERO_WIDTHS = [480, 960];

/** Every width set the site renders, for the SW to precache exhaustively. */
export const ALL_IMAGE_WIDTHS = [CARD_WIDTHS, HERO_WIDTHS];
