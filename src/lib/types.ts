/** Shared domain types used by both the site and the pure-logic helpers. */

export interface Ingredient {
  /** Numeric quantity. Omitted for non-scalable items (e.g. "to taste"). */
  amount?: number;
  /** Unit of measure, e.g. "g", "ml", "tsp". Omitted for countable items. */
  unit?: string;
  /** Ingredient name (required). Referenced from method steps via [[name]]. */
  name: string;
  /** Muted clarifier shown after the name, e.g. "grated", "to taste". */
  note?: string;
}
