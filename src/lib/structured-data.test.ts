import { describe, it, expect } from 'vitest';
import { recipeJsonLd, type RecipeSchemaInput } from './structured-data';

const base: RecipeSchemaInput = {
  title: 'Chocolate Brownie',
  locale: 'en',
  servings: 12,
  prepTime: '20 min',
  cookTime: '30 min',
  ingredients: [
    { amount: 200, unit: 'g', name: 'dark chocolate' },
    { amount: 3, name: 'eggs' },
    { name: 'salt', note: 'to taste' },
  ],
  method: ['Melt the [[dark chocolate]].', 'Whisk the [[eggs]].'],
};

describe('recipeJsonLd', () => {
  it('emits the required Recipe shape', () => {
    const s = recipeJsonLd(base);
    expect(s['@context']).toBe('https://schema.org');
    expect(s['@type']).toBe('Recipe');
    expect(s.name).toBe('Chocolate Brownie');
    expect(s.inLanguage).toBe('en');
    expect(s.recipeYield).toBe('12 servings');
  });

  it('formats ingredient lines with quantity, name and note', () => {
    const s = recipeJsonLd(base);
    expect(s.recipeIngredient).toEqual([
      '200g dark chocolate',
      '3 eggs',
      'salt (to taste)',
    ]);
  });

  it('strips [[refs]] from instruction text into HowToSteps', () => {
    const s = recipeJsonLd(base);
    expect(s.recipeInstructions).toEqual([
      { '@type': 'HowToStep', text: 'Melt the dark chocolate.' },
      { '@type': 'HowToStep', text: 'Whisk the eggs.' },
    ]);
  });

  it('converts prep/cook/total times to ISO 8601 durations', () => {
    const s = recipeJsonLd(base);
    expect(s.prepTime).toBe('PT20M');
    expect(s.cookTime).toBe('PT30M');
    expect(s.totalTime).toBe('PT50M');
  });

  it('omits durations that cannot be parsed', () => {
    const s = recipeJsonLd({ ...base, prepTime: 'overnight', cookTime: '' });
    expect(s.prepTime).toBeUndefined();
    expect(s.cookTime).toBeUndefined();
    expect(s.totalTime).toBeUndefined();
  });

  it('includes optional fields only when present', () => {
    const s = recipeJsonLd({
      ...base,
      description: 'A fudgy brownie.',
      imageUrl: 'https://example.com/recipes/brownie.jpg',
      url: 'https://example.com/recipes/en/desserts/brownie',
      author: "Rodrigo's Kitchen",
      category: 'desserts',
      tags: ['chocolate', 'baking'],
      sourceUrl: 'https://source.example/brownie',
    });
    expect(s.description).toBe('A fudgy brownie.');
    expect(s.image).toEqual(['https://example.com/recipes/brownie.jpg']);
    expect(s.mainEntityOfPage).toBe(
      'https://example.com/recipes/en/desserts/brownie',
    );
    expect(s.author).toEqual({ '@type': 'Person', name: "Rodrigo's Kitchen" });
    expect(s.recipeCategory).toBe('desserts');
    expect(s.keywords).toBe('chocolate, baking');
    expect(s.isBasedOn).toBe('https://source.example/brownie');
  });

  it('omits optional fields when absent', () => {
    const s = recipeJsonLd(base);
    for (const key of [
      'description',
      'image',
      'author',
      'recipeCategory',
      'keywords',
      'isBasedOn',
      'nutrition',
    ]) {
      expect(s[key]).toBeUndefined();
    }
  });

  it('maps recognised nutrition keys to schema.org properties', () => {
    const s = recipeJsonLd({
      ...base,
      nutrition: {
        Calories: '250 kcal',
        Protein: '6 g',
        Carbs: '30 g',
        'Saturated Fat': '4 g',
        vibes: 'immaculate',
      },
    });
    expect(s.nutrition).toEqual({
      '@type': 'NutritionInformation',
      calories: '250 kcal',
      proteinContent: '6 g',
      carbohydrateContent: '30 g',
      saturatedFatContent: '4 g',
    });
  });

  it('drops the nutrition object when no keys are recognised', () => {
    const s = recipeJsonLd({ ...base, nutrition: { vibes: 'immaculate' } });
    expect(s.nutrition).toBeUndefined();
  });
});
