import { describe, expect, it } from 'vitest';
import { applyReviewOutcome } from './applyReviewOutcome';
import { DAY_MS } from './time';

describe('applyReviewOutcome', () => {
  const now = 5 * DAY_MS;

  it('correct: +15 к рейтингу, streak увеличивается', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 2 }, 'correct', now);
    expect(next.rating).toBe(65);
    expect(next.reviewStreak).toBe(3);
    expect(next.lastReviewedAt).toBe(now);
  });

  it('correct: не превышает 100', () => {
    const next = applyReviewOutcome({ rating: 95, reviewStreak: 0 }, 'correct', now);
    expect(next.rating).toBe(100);
  });

  it('almost: +5 к рейтингу, streak сбрасывается', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'almost', now);
    expect(next.rating).toBe(55);
    expect(next.reviewStreak).toBe(0);
  });

  it('wrong: -25 от рейтинга, streak сбрасывается', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'wrong', now);
    expect(next.rating).toBe(25);
    expect(next.reviewStreak).toBe(0);
  });

  it('wrong: не опускается ниже 0', () => {
    const next = applyReviewOutcome({ rating: 10, reviewStreak: 0 }, 'wrong', now);
    expect(next.rating).toBe(0);
  });

  it('считает от эффективного (распавшегося) рейтинга, а не от устаревшего сохранённого', () => {
    const lastReviewedAt = now - 10 * DAY_MS;
    const next = applyReviewOutcome({ rating: 80, reviewStreak: 0, lastReviewedAt }, 'correct', now);
    expect(next.rating).toBeLessThan(80);
  });
});
