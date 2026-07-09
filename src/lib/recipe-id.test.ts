import { describe, it, expect } from 'vitest';
import { categoryOf, localeOf, recipeKeyOf } from './recipe-id';

describe('categoryOf', () => {
  it('reads the first path segment', () => {
    expect(categoryOf('desserts/condensed-milk-flan/en')).toBe('desserts');
    expect(categoryOf('mains/carrot-soup/pt')).toBe('mains');
  });
});

describe('localeOf', () => {
  it('reads the last path segment when it is a known locale', () => {
    expect(localeOf('desserts/flan/en')).toBe('en');
    expect(localeOf('desserts/flan/pt')).toBe('pt');
  });

  it('falls back to the default locale for an unknown suffix', () => {
    expect(localeOf('desserts/flan/de')).toBe('en');
    expect(localeOf('desserts/flan')).toBe('en');
  });
});

describe('recipeKeyOf', () => {
  it('drops the trailing locale segment', () => {
    expect(recipeKeyOf('desserts/condensed-milk-flan/en')).toBe(
      'desserts/condensed-milk-flan',
    );
    expect(recipeKeyOf('mains/carrot-soup/pt')).toBe('mains/carrot-soup');
  });

  it('is stable across locales for the same recipe', () => {
    expect(recipeKeyOf('mains/carrot-soup/en')).toBe(
      recipeKeyOf('mains/carrot-soup/pt'),
    );
  });
});
