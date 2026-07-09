import type { Ingredient } from './types';

/** Round to at most 2 decimals, trimming trailing zeros (350, 4.2, 0.67). */
export function roundNice(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Scale an amount by a factor, rounded for display. */
export function scaleAmount(amount: number, factor: number): number {
  return roundNice(amount * factor);
}

/**
 * Format an ingredient quantity for display, e.g. "250g", "0.5 tsp", "3".
 *
 * Short units (<= 2 chars, e.g. g/ml/kg/oz) attach directly to the number to
 * match common recipe styling; longer units (tsp/cup) get a space. Returns an
 * empty string when there is no numeric amount.
 */
export function formatQuantity(
  ingredient: Pick<Ingredient, 'amount' | 'unit'>,
): string {
  const { amount, unit } = ingredient;
  if (amount === undefined || amount === null) return '';
  const value = String(roundNice(amount));
  if (!unit) return value;
  return unit.length <= 2 ? `${value}${unit}` : `${value} ${unit}`;
}
