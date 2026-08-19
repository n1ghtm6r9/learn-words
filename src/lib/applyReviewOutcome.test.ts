import { describe, expect, it } from 'vitest';
import { applyReviewOutcome } from './applyReviewOutcome';
import { DAY_MS } from './time';

describe('applyReviewOutcome', () => {
  const now = 5 * DAY_MS;

  it('correct: +15 to rating, streak increases', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 2 }, 'correct', now);
    expect(next.rating).toBe(65);
    expect(next.reviewStreak).toBe(3);
    expect(next.lastReviewedAt).toBe(now);
  });

  it('correct: does not exceed 100', () => {
    const next = applyReviewOutcome({ rating: 95, reviewStreak: 0 }, 'correct', now);
    expect(next.rating).toBe(100);
  });

  it('almost: +5 to rating, streak resets', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'almost', now);
    expect(next.rating).toBe(55);
    expect(next.reviewStreak).toBe(0);
  });

  it('wrong: -25 from rating, streak resets', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'wrong', now);
    expect(next.rating).toBe(25);
    expect(next.reviewStreak).toBe(0);
  });

  it('wrong: does not go below 0', () => {
    const next = applyReviewOutcome({ rating: 10, reviewStreak: 0 }, 'wrong', now);
    expect(next.rating).toBe(0);
  });

  it('computes from the effective (decayed) rating, not the stale stored one', () => {
    const lastReviewedAt = now - 10 * DAY_MS;
    const next = applyReviewOutcome({ rating: 80, reviewStreak: 0, lastReviewedAt }, 'correct', now);
    expect(next.rating).toBeLessThan(80);
  });
});
