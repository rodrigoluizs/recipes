/**
 * Responsive image widths, kept in one place so the two contexts that render a
 * recipe photo agree on the sizes they emit.
 */

/** Recipe card thumbnails on the feed (`RecipeCard.astro`). */
export const CARD_WIDTHS = [320, 640];

/** Full-bleed hero on the recipe detail page (`[locale]/[...slug].astro`). */
export const HERO_WIDTHS = [480, 960];
