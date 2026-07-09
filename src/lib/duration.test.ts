import { describe, it, expect } from 'vitest';
import { parseDuration, formatDuration, totalTime } from './duration';

describe('parseDuration', () => {
  it.each([
    ['40 min', 40],
    ['30 min', 30],
    ['1 hr', 60],
    ['1 hr 10 min', 70],
    ['1 hour 30 minutes', 90],
    ['1h', 60],
    ['1h10', 70],
    ['45m', 45],
    ['90 min', 90],
    ['90', 90],
    ['2.5 hr', 150],
  ])('parses %j as %i minutes', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it.each(['to taste', 'overnight', '', '   '])(
    'returns null for unparseable %j',
    (input) => {
      expect(parseDuration(input)).toBeNull();
    },
  );

  it('returns null for null/undefined', () => {
    expect(parseDuration(null)).toBeNull();
    expect(parseDuration(undefined)).toBeNull();
  });
});

describe('formatDuration', () => {
  it.each([
    [40, '40 min'],
    [60, '1 hr'],
    [70, '1 hr 10 min'],
    [150, '2 hr 30 min'],
    [0, '0 min'],
  ])('formats %i as %j', (min, expected) => {
    expect(formatDuration(min)).toBe(expected);
  });
});

describe('totalTime', () => {
  it('sums when both parse', () => {
    expect(totalTime('40 min', '30 min')).toBe('1 hr 10 min');
  });
  it('falls back to joining raw strings when one is unparseable', () => {
    expect(totalTime('overnight', '30 min')).toBe('overnight + 30 min');
  });
});
