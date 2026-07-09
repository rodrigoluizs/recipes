import { describe, it, expect } from 'vitest';
import { roundNice, scaleAmount, formatQuantity } from './quantity';

describe('roundNice', () => {
  it.each([
    [350, 350],
    [4.2, 4.2],
    [0.666, 0.67],
    [0.7, 0.7],
  ])('rounds %f to %f', (input, expected) => {
    expect(roundNice(input)).toBe(expected);
  });
});

describe('scaleAmount', () => {
  it('scales 250 by 1.4 to 350', () => {
    expect(scaleAmount(250, 1.4)).toBe(350);
  });
  it('scales 3 by 1.4 to 4.2', () => {
    expect(scaleAmount(3, 1.4)).toBe(4.2);
  });
  it('scales 0.5 by 2 to 1', () => {
    expect(scaleAmount(0.5, 2)).toBe(1);
  });
});

describe('formatQuantity', () => {
  it.each([
    [{ amount: 250, unit: 'g' }, '250g'],
    [{ amount: 200, unit: 'ml' }, '200ml'],
    [{ amount: 0.5, unit: 'tsp' }, '0.5 tsp'],
    [{ amount: 3 }, '3'],
    [{ amount: 2, unit: 'cups' }, '2 cups'],
  ])('formats %o as %j', (input, expected) => {
    expect(formatQuantity(input)).toBe(expected);
  });

  it('returns empty string when no amount', () => {
    expect(formatQuantity({ unit: 'g' })).toBe('');
    expect(formatQuantity({})).toBe('');
  });
});
