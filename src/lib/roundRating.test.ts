import { describe, expect, it } from 'vitest';
import { roundRating } from './roundRating';

describe('roundRating', () => {
  it('rounds to two decimal places', () => {
    expect(roundRating(73.4567)).toBe(73.46);
  });

  it('leaves an already-precise value unchanged', () => {
    expect(roundRating(50)).toBe(50);
  });

  it('rounds halves up', () => {
    expect(roundRating(41.005)).toBeCloseTo(41.01, 2);
  });

  it('handles values that need no rounding at two decimals', () => {
    expect(roundRating(41.1)).toBe(41.1);
  });
});
