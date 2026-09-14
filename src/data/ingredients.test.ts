import { describe, it, expect } from 'vitest';
import { INGREDIENTS, isIngredientId, ingredientName } from './ingredients';

describe('ingredient database', () => {
  it('defines every locale for every id', () => {
    for (const [id, entry] of Object.entries(INGREDIENTS)) {
      expect(entry.en, `${id}.en`).toBeTruthy();
      expect(entry.pt, `${id}.pt`).toBeTruthy();
    }
  });

  it('recognises known ids and rejects unknown ones', () => {
    expect(isIngredientId('milk')).toBe(true);
    expect(isIngredientId('unicorn-tears')).toBe(false);
  });

  it('resolves the canonical name per locale', () => {
    expect(ingredientName('milk', 'en')).toBe('milk');
    expect(ingredientName('milk', 'pt')).toBe('leite');
  });

  it('falls back to the id for an unknown ingredient', () => {
    expect(ingredientName('unknown', 'pt')).toBe('unknown');
  });
});
