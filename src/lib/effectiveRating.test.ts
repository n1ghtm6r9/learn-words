import { describe, expect, it } from 'vitest';
import { effectiveRating } from './effectiveRating';
import { DAY_MS } from './time';

describe('effectiveRating', () => {
  it('returns the original rating with no decay when lastReviewedAt is not set', () => {
    expect(effectiveRating({ rating: 70, reviewStreak: 0 }, 1000)).toBe(70);
  });

  it('returns the original rating with no decay right after a review (elapsed=0)', () => {
    const now = 1000;
    expect(effectiveRating({ rating: 70, reviewStreak: 0, lastReviewedAt: now }, now)).toBe(70);
  });

  it('decays by half after exactly one half-life period', () => {
    const now = 10 * DAY_MS;
    const lastReviewedAt = now - 2 * DAY_MS;
    expect(effectiveRating({ rating: 80, reviewStreak: 0, lastReviewedAt }, now)).toBe(40);
  });

  it('decays slower with a higher reviewStreak', () => {
    const now = 10 * DAY_MS;
    const lastReviewedAt = now - 2 * DAY_MS;
    const slow = effectiveRating({ rating: 80, reviewStreak: 5, lastReviewedAt }, now);
    const fast = effectiveRating({ rating: 80, reviewStreak: 0, lastReviewedAt }, now);
    expect(slow).toBeGreaterThan(fast);
  });

  it('does not go below 0 for a very old review', () => {
    const now = 1000 * DAY_MS;
    expect(effectiveRating({ rating: 50, reviewStreak: 0, lastReviewedAt: 0 }, now)).toBe(0);
  });

  it('does not inflate the rating when lastReviewedAt is in the future (clock skew)', () => {
    const now = 10 * DAY_MS;
    const lastReviewedAt = now + 5 * DAY_MS;
    expect(effectiveRating({ rating: 70, reviewStreak: 0, lastReviewedAt }, now)).toBe(70);
  });

  it('preserves two decimal places of precision instead of rounding to a whole number', () => {
    const now = 1 * DAY_MS;
    const lastReviewedAt = 0;
    const result = effectiveRating({ rating: 73, reviewStreak: 2, lastReviewedAt }, now);
    expect(Number.isInteger(result)).toBe(false);
  });
});
