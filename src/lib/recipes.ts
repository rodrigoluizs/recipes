import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/config';
import { categoryOf, localeOf, recipeKeyOf } from './recipe-id';

export type RecipeEntry = CollectionEntry<'recipes'>;

export { categoryOf, localeOf, recipeKeyOf };

/** All recipes for a locale, sorted alphabetically by title. */
export async function getRecipesByLocale(
  locale: Locale,
): Promise<RecipeEntry[]> {
  const recipes = await getCollection(
    'recipes',
    (entry) => localeOf(entry.id) === locale,
  );
  return recipes.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

/** Distinct categories present in the collection, sorted. */
export function getCategories(recipes: RecipeEntry[]): string[] {
  return [...new Set(recipes.map((r) => categoryOf(r.id)))].sort();
}
