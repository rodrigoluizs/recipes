import { scaleAmount } from './quantity';

/** Minimal ingredient shape the shopping list needs (id + optional qty). */
export interface ShoppingInput {
  id: string;
  unit?: string;
  amount?: number;
}

/**
 * Pure shopping-list model. No DOM, no storage — those live in the client
 * script so this stays unit-testable. Every mutating function returns a new
 * list rather than mutating in place.
 *
 * Two flavours of line:
 * - `recipe`: comes from a recipe ingredient, carries a canonical `id`, an
 *   optional `unit` and a (scaled) `amount`. Lines merge — and their amounts
 *   sum — when both `id` and `unit` match, so the same ingredient added from
 *   different recipes (or the same one in another language) collapses to one
 *   line with the combined quantity.
 * - `manual`: free text typed by the user for something not in any recipe.
 *   Never merges with recipe lines; deduped only against identical text.
 */

export interface RecipeLine {
  kind: 'recipe';
  id: string;
  unit?: string;
  /** Scaled amount; undefined for "to taste" items. */
  amount?: number;
  checked: boolean;
}

export interface ManualLine {
  kind: 'manual';
  text: string;
  checked: boolean;
}

export type ShoppingLine = RecipeLine | ManualLine;

export interface ShoppingList {
  /** Storage schema version, for forward-compatible migrations. */
  v: 1;
  items: ShoppingLine[];
}

export function emptyList(): ShoppingList {
  return { v: 1, items: [] };
}

/** Normalize free text for dedup: trimmed, lowercased, whitespace-collapsed. */
function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Stable identity for a line, used to toggle/remove and to detect merges.
 * Recipe lines key on id+unit; manual lines on their normalized text.
 */
export function lineKey(line: ShoppingLine): string {
  return line.kind === 'recipe'
    ? `r:${line.id}:${line.unit ?? ''}`
    : `m:${normalizeText(line.text)}`;
}

/**
 * Add every ingredient of a recipe at the current scale. Amounts are scaled
 * once, at add time (a snapshot — later re-scaling of the recipe does not
 * change what is already on the list). Matching id+unit lines have their
 * amounts summed.
 */
export function addRecipeIngredients(
  list: ShoppingList,
  ingredients: ShoppingInput[],
  factor: number,
): ShoppingList {
  const items = list.items.slice();
  const indexByKey = new Map(items.map((it, i) => [lineKey(it), i]));

  for (const ing of ingredients) {
    const scaled =
      ing.amount !== undefined ? scaleAmount(ing.amount, factor) : undefined;
    const line: RecipeLine = {
      kind: 'recipe',
      id: ing.id,
      unit: ing.unit,
      amount: scaled,
      checked: false,
    };
    const key = lineKey(line);
    const existingIndex = indexByKey.get(key);

    if (existingIndex === undefined) {
      indexByKey.set(key, items.length);
      items.push(line);
      continue;
    }

    const existing = items[existingIndex] as RecipeLine;
    const merged: RecipeLine = {
      ...existing,
      amount: sumAmounts(existing.amount, scaled),
    };
    items[existingIndex] = merged;
  }

  return { ...list, items };
}

/** Sum two optional amounts; undefined behaves as "no contribution". */
function sumAmounts(a?: number, b?: number): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return a + b;
}

/** Add a free-text item, ignoring blanks and exact-text duplicates. */
export function addManualItem(list: ShoppingList, text: string): ShoppingList {
  const trimmed = text.trim();
  if (!trimmed) return list;
  const key = `m:${normalizeText(trimmed)}`;
  if (list.items.some((it) => lineKey(it) === key)) return list;
  const line: ManualLine = { kind: 'manual', text: trimmed, checked: false };
  return { ...list, items: [...list.items, line] };
}

/** Set the checked ("already have") state of a line by key. */
export function setChecked(
  list: ShoppingList,
  key: string,
  checked: boolean,
): ShoppingList {
  return {
    ...list,
    items: list.items.map((it) =>
      lineKey(it) === key ? { ...it, checked } : it,
    ),
  };
}

/** Remove a single line by key. */
export function removeLine(list: ShoppingList, key: string): ShoppingList {
  return { ...list, items: list.items.filter((it) => lineKey(it) !== key) };
}

/** Drop every checked line. */
export function clearChecked(list: ShoppingList): ShoppingList {
  return { ...list, items: list.items.filter((it) => !it.checked) };
}

/** Number of unchecked lines — what the cart badge shows. */
export function uncheckedCount(list: ShoppingList): number {
  return list.items.reduce((n, it) => (it.checked ? n : n + 1), 0);
}
