import { getCollection, type CollectionEntry } from 'astro:content';

export type RecipeEntry = CollectionEntry<'recipes'>;

/** The category is the first path segment of a recipe id. */
export function categoryOf(id: string): string {
  return id.split('/')[0] ?? '';
}

/** Title-case a category id ("main-dishes" -> "Main Dishes") for display. */
export function categoryLabel(category: string): string {
  return category
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** All recipes, sorted alphabetically by title. */
export async function getAllRecipes(): Promise<RecipeEntry[]> {
  const recipes = await getCollection('recipes');
  return recipes.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

/** Distinct categories present in the collection, sorted. */
export function getCategories(recipes: RecipeEntry[]): string[] {
  return [...new Set(recipes.map((r) => categoryOf(r.id)))].sort();
}

export interface SearchRecord {
  id: string;
  title: string;
  category: string;
  tags: string[];
  ingredients: string[];
}

/** Minimal record used by the client-side search index. */
export function toSearchRecord(entry: RecipeEntry): SearchRecord {
  return {
    id: entry.id,
    title: entry.data.title,
    category: categoryOf(entry.id),
    tags: entry.data.tags,
    ingredients: entry.data.ingredients.map((i) => i.name),
  };
}
