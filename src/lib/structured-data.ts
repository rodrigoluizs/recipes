/**
 * Build schema.org/Recipe JSON-LD from a recipe's fields.
 *
 * This is what search engines (Google Rich Results, etc.) read to index a
 * recipe and render rich snippets. It is derived entirely from the recipe
 * frontmatter at build time, so every recipe — existing or newly added — gets
 * valid structured data for free, with nothing to author by hand.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/recipe
 */
import type { Ingredient } from './types';
import { formatQuantity } from './quantity';
import { parseDuration, toISODuration } from './duration';
import { parseStep } from './references';

export interface RecipeSchemaInput {
  title: string;
  /** Plain-text description (recommended by Google); omitted when empty. */
  description?: string;
  /** Absolute image URL(s); omitted when the recipe has no photo. */
  imageUrl?: string;
  /** BCP-47 language tag of this rendering, e.g. "en" or "pt". */
  locale: string;
  servings: number;
  /** Free-text prep/cook times (e.g. "20 min", "1 hr 10 min"). */
  prepTime: string;
  cookTime: string;
  ingredients: Ingredient[];
  method: string[];
  /** Recipe category (the folder segment), e.g. "desserts". */
  category?: string;
  tags?: string[];
  /** Absolute canonical URL of this recipe page. */
  url?: string;
  /** Original source recipe URL, if any. */
  sourceUrl?: string;
  /** Free-form nutrition key/values; mapped to schema.org where recognised. */
  nutrition?: Record<string, string | number>;
  /** Author/site name shown as the recipe's author. */
  author?: string;
}

/** Render an ingredient as a single human-readable line, e.g. "250g cheese (grated)". */
function ingredientLine(i: Ingredient): string {
  return [formatQuantity(i), i.name, i.note ? `(${i.note})` : '']
    .filter(Boolean)
    .join(' ')
    .trim();
}

/** Flatten a method step to plain text, dropping the [[ref]] markers. */
function stepText(step: string): string {
  return parseStep(step)
    .map((token) => (token.type === 'text' ? token.value : token.name))
    .join('')
    .trim();
}

/**
 * Map free-form nutrition keys onto schema.org NutritionInformation properties.
 * Keys are matched case/space-insensitively; unrecognised keys are dropped
 * because the schema only allows a fixed set of properties.
 */
const NUTRITION_KEYS: Record<string, string> = {
  calories: 'calories',
  energy: 'calories',
  protein: 'proteinContent',
  fat: 'fatContent',
  saturatedfat: 'saturatedFatContent',
  unsaturatedfat: 'unsaturatedFatContent',
  transfat: 'transFatContent',
  carbs: 'carbohydrateContent',
  carbohydrate: 'carbohydrateContent',
  carbohydrates: 'carbohydrateContent',
  sugar: 'sugarContent',
  sugars: 'sugarContent',
  fiber: 'fiberContent',
  fibre: 'fiberContent',
  sodium: 'sodiumContent',
  cholesterol: 'cholesterolContent',
};

function nutritionInformation(
  nutrition: Record<string, string | number>,
): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const [rawKey, value] of Object.entries(nutrition)) {
    const prop = NUTRITION_KEYS[rawKey.toLowerCase().replace(/[\s_-]/g, '')];
    if (prop && !(prop in out)) out[prop] = String(value);
  }
  return Object.keys(out).length ? { '@type': 'NutritionInformation', ...out } : null;
}

/** Build the schema.org/Recipe object for JSON-LD embedding. */
export function recipeJsonLd(input: RecipeSchemaInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: input.title,
    inLanguage: input.locale,
    recipeYield: `${input.servings} servings`,
    recipeIngredient: input.ingredients.map(ingredientLine),
    recipeInstructions: input.method.map((step) => ({
      '@type': 'HowToStep',
      text: stepText(step),
    })),
  };

  if (input.description) schema.description = input.description;
  if (input.imageUrl) schema.image = [input.imageUrl];
  if (input.url) schema.mainEntityOfPage = input.url;
  if (input.author) schema.author = { '@type': 'Person', name: input.author };
  if (input.category) schema.recipeCategory = input.category;
  if (input.tags && input.tags.length) schema.keywords = input.tags.join(', ');
  if (input.sourceUrl) schema.isBasedOn = input.sourceUrl;

  const prep = toISODuration(parseDuration(input.prepTime) ?? 0);
  const cook = toISODuration(parseDuration(input.cookTime) ?? 0);
  if (prep) schema.prepTime = prep;
  if (cook) schema.cookTime = cook;

  const prepMin = parseDuration(input.prepTime);
  const cookMin = parseDuration(input.cookTime);
  if (prepMin !== null && cookMin !== null) {
    const total = toISODuration(prepMin + cookMin);
    if (total) schema.totalTime = total;
  }

  if (input.nutrition) {
    const nutrition = nutritionInformation(input.nutrition);
    if (nutrition) schema.nutrition = nutrition;
  }

  return schema;
}
