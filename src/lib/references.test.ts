import { describe, it, expect } from 'vitest';
import { parseStep, resolveRef, validateSteps } from './references';
import type { Ingredient } from './types';

const ingredients: Ingredient[] = [
  { amount: 200, unit: 'g', name: 'dark chocolate' },
  { amount: 3, name: 'eggs' },
  { name: 'salt', note: 'to taste' },
];

describe('parseStep', () => {
  it('splits a step with two references', () => {
    expect(parseStep('Whisk the [[eggs]] and [[dark chocolate]].')).toEqual([
      { type: 'text', value: 'Whisk the ' },
      { type: 'ref', name: 'eggs' },
      { type: 'text', value: ' and ' },
      { type: 'ref', name: 'dark chocolate' },
      { type: 'text', value: '.' },
    ]);
  });

  it('returns a single text token when there are no references', () => {
    expect(parseStep('Preheat the oven.')).toEqual([
      { type: 'text', value: 'Preheat the oven.' },
    ]);
  });

  it('handles a reference at the start', () => {
    expect(parseStep('[[salt]] to finish')).toEqual([
      { type: 'ref', name: 'salt' },
      { type: 'text', value: ' to finish' },
    ]);
  });
});

describe('resolveRef', () => {
  it('resolves case-insensitively', () => {
    expect(resolveRef('Dark Chocolate', ingredients)?.amount).toBe(200);
  });
  it('returns null for an unknown ingredient', () => {
    expect(resolveRef('butter', ingredients)).toBeNull();
  });
});

describe('validateSteps', () => {
  it('reports unique unmatched references', () => {
    const method = [
      'Melt the [[dark chocolate]].',
      'Add [[butter]] and more [[butter]].',
    ];
    expect(validateSteps(method, ingredients)).toEqual(['butter']);
  });
  it('returns empty when all references resolve', () => {
    expect(validateSteps(['Whisk the [[eggs]].'], ingredients)).toEqual([]);
  });
});
