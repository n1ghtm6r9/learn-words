import { describe, expect, it } from 'vitest';
import { effectiveRating } from './effectiveRating';
import { DAY_MS } from './time';

describe('effectiveRating', () => {
  it('возвращает исходный rating без распада, если lastReviewedAt не задан', () => {
    expect(effectiveRating({ rating: 70, reviewStreak: 0 }, 1000)).toBe(70);
  });

  it('возвращает исходный rating без распада сразу после повтора (elapsed=0)', () => {
    const now = 1000;
    expect(effectiveRating({ rating: 70, reviewStreak: 0, lastReviewedAt: now }, now)).toBe(70);
  });

  it('распадается вдвое ровно через один период полураспада', () => {
    const now = 10 * DAY_MS;
    const lastReviewedAt = now - 2 * DAY_MS; // halfLifeDays(0) === 2
    expect(effectiveRating({ rating: 80, reviewStreak: 0, lastReviewedAt }, now)).toBe(40);
  });

  it('распадается медленнее при большем reviewStreak', () => {
    const now = 10 * DAY_MS;
    const lastReviewedAt = now - 2 * DAY_MS;
    const slow = effectiveRating({ rating: 80, reviewStreak: 5, lastReviewedAt }, now);
    const fast = effectiveRating({ rating: 80, reviewStreak: 0, lastReviewedAt }, now);
    expect(slow).toBeGreaterThan(fast);
  });

  it('не опускается ниже 0 при очень старом повторе', () => {
    const now = 1000 * DAY_MS;
    expect(effectiveRating({ rating: 50, reviewStreak: 0, lastReviewedAt: 0 }, now)).toBe(0);
  });
});
