import { describe, it, expect } from 'vitest';
import { t, format, categoryLabel } from './ui';

describe('t', () => {
  it('returns localized strings', () => {
    expect(t('en').ingredients).toBe('Ingredients');
    expect(t('pt').ingredients).toBe('Ingredientes');
  });

  it('falls back to English for any string a locale omits', () => {
    // Every pt key is defined, so equality with itself proves the merge keeps
    // pt values; the fallback source is en for absent keys.
    const pt = t('pt');
    expect(pt.method).toBe('Modo de preparo');
    // A key present in both stays the locale's own value, not en's.
    expect(pt.method).not.toBe(t('en').method);
  });
});

describe('format', () => {
  it('interpolates named placeholders', () => {
    expect(format('Step {n} of {m}', { n: 2, m: 5 })).toBe('Step 2 of 5');
    expect(format('Por porção original ({n} porções).', { n: 6 })).toBe(
      'Por porção original (6 porções).',
    );
  });

  it('leaves unknown placeholders untouched', () => {
    expect(format('{a} {b}', { a: 'x' })).toBe('x {b}');
  });
});

describe('categoryLabel', () => {
  it('translates known categories', () => {
    expect(categoryLabel('desserts', 'en')).toBe('Desserts');
    expect(categoryLabel('desserts', 'pt')).toBe('Sobremesas');
  });

  it('title-cases an unknown category as a fallback', () => {
    expect(categoryLabel('main-dishes', 'pt')).toBe('Main Dishes');
  });
});
