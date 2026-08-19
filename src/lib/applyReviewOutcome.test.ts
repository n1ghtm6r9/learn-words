import { describe, expect, it } from 'vitest';
import { applyReviewOutcome } from './applyReviewOutcome';
import { DAY_MS } from './time';

describe('applyReviewOutcome', () => {
  const now = 5 * DAY_MS;

  it('correct: rewards a base amount and increases the streak', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 2 }, 'correct', 1, 1, now);
    expect(next.rating).toBe(64);
    expect(next.reviewStreak).toBe(3);
    expect(next.lastReviewedAt).toBe(now);
    expect(next.stage).toBeUndefined();
  });

  it('correct: a longer streak earns a bigger reward', () => {
    const freshStreak = applyReviewOutcome({ rating: 50, reviewStreak: 0 }, 'correct', 1, 1, now);
    const longStreak = applyReviewOutcome({ rating: 50, reviewStreak: 8 }, 'correct', 1, 1, now);
    expect(longStreak.rating).toBeGreaterThan(freshStreak.rating);
  });

  it('correct: the streak bonus caps out instead of growing forever', () => {
    const cappedStreak = applyReviewOutcome({ rating: 50, reviewStreak: 10 }, 'correct', 1, 1, now);
    const beyondCap = applyReviewOutcome({ rating: 50, reviewStreak: 25 }, 'correct', 1, 1, now);
    expect(beyondCap.rating).toBe(cappedStreak.rating);
  });

  it('correct: does not exceed 100', () => {
    const next = applyReviewOutcome({ rating: 95, reviewStreak: 0 }, 'correct', 1, 1, now);
    expect(next.rating).toBe(100);
  });

  it('correct: a slow answer earns less reward than a fast one', () => {
    const fast = applyReviewOutcome({ rating: 50, reviewStreak: 2 }, 'correct', 1, 1, now);
    const slow = applyReviewOutcome({ rating: 50, reviewStreak: 2 }, 'correct', 1, 0.5, now);
    expect(slow.rating).toBeLessThan(fast.rating);
    expect(slow.rating).toBeGreaterThan(50);
  });

  it('correct: even a very slow answer still rewards something, since it was still correct', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 0 }, 'correct', 1, 0.5, now);
    expect(next.rating).toBeGreaterThan(50);
  });

  it('almost (minor error): still costs rating, but far less than a bad miss, and does not reset the streak', () => {
    const minor = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'almost', 2 / 3, 1, now);
    const gross = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'wrong', 2 / 3, 1, now);
    expect(minor.rating).toBeLessThan(50);
    expect(minor.rating).toBeGreaterThan(gross.rating);
    expect(minor.reviewStreak).toBe(3);
  });

  it('a single typo on a short word never costs more than one perfect answer earns', () => {
    const shortWordAccuracy = 2 / 3;
    const typo = applyReviewOutcome({ rating: 50, reviewStreak: 0 }, 'almost', shortWordAccuracy, 1, now);
    const perfect = applyReviewOutcome({ rating: 50, reviewStreak: 0 }, 'correct', 1, 1, now);
    expect(50 - typo.rating).toBeLessThan(perfect.rating - 50);
  });

  it('a single typo cannot wipe a word that still has a real rating', () => {
    const next = applyReviewOutcome({ rating: 8, reviewStreak: 6 }, 'almost', 2 / 3, 1, now);
    expect(next.rating).toBeGreaterThan(0);
    expect(next.stage).toBeUndefined();
    expect(next.reviewStreak).toBe(6);
  });

  it('a correct verdict rewards even if the accuracy argument is unusable', () => {
    const next = applyReviewOutcome({ rating: 95, reviewStreak: 9 }, 'correct', NaN, 1, now);
    expect(next.rating).toBeGreaterThan(95);
    expect(next.stage).toBeUndefined();
  });

  it('a well-known word (long streak) loses less to the same mistake than a shaky one', () => {
    const shaky = applyReviewOutcome({ rating: 50, reviewStreak: 0 }, 'wrong', 0, 1, now);
    const wellKnown = applyReviewOutcome({ rating: 50, reviewStreak: 10 }, 'wrong', 0, 1, now);
    expect(wellKnown.rating).toBeGreaterThan(shaky.rating);
  });

  it('penalty resilience caps out instead of making mistakes free', () => {
    const atCap = applyReviewOutcome({ rating: 50, reviewStreak: 10 }, 'wrong', 0, 1, now);
    const beyondCap = applyReviewOutcome({ rating: 50, reviewStreak: 50 }, 'wrong', 0, 1, now);
    expect(beyondCap.rating).toBe(atCap.rating);
    expect(atCap.rating).toBeLessThan(50);
  });

  it('wrong: a near-miss costs less than a wildly wrong guess', () => {
    const nearMiss = applyReviewOutcome({ rating: 50, reviewStreak: 0 }, 'wrong', 0.6, 1, now);
    const wildGuess = applyReviewOutcome({ rating: 50, reviewStreak: 0 }, 'wrong', 0, 1, now);
    expect(nearMiss.rating).toBeGreaterThan(wildGuess.rating);
  });

  it('wrong: resets the streak even when the rating stays above 0', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'wrong', 0.5, 1, now);
    expect(next.reviewStreak).toBe(0);
    expect(next.stage).toBeUndefined();
  });

  it('wrong: a rating that reaches 0 sends the word back to relearning from scratch', () => {
    const next = applyReviewOutcome({ rating: 10, reviewStreak: 4 }, 'wrong', 0, 1, now);
    expect(next.rating).toBe(0);
    expect(next.stage).toBe('new');
    expect(next.learningPhase).toBe('A');
    expect(next.phaseStreak).toBe(0);
    expect(next.reviewStreak).toBe(0);
  });

  it('almost: a rating that reaches 0 also sends the word back to relearning, not just a wrong verdict', () => {
    const next = applyReviewOutcome({ rating: 3, reviewStreak: 0 }, 'almost', 0.9, 1, now);
    expect(next.rating).toBe(0);
    expect(next.stage).toBe('new');
  });

  it('wrong: a rating that stays above 0 does not trigger relearning', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 0 }, 'wrong', 0.5, 1, now);
    expect(next.rating).toBeGreaterThan(0);
    expect(next.stage).toBeUndefined();
    expect(next.learningPhase).toBeUndefined();
  });

  it('ratings can carry two decimal places instead of being rounded to a whole number', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 2 }, 'correct', 1, 0.73, now);
    expect(Number.isInteger(next.rating)).toBe(false);
  });

  it('ratings never carry more than two decimal places', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 2 }, 'correct', 1, 0.7337, now);
    expect(next.rating).toBe(60.27);
  });

  it('computes from the effective (decayed) rating, not the stale stored one', () => {
    const lastReviewedAt = now - 10 * DAY_MS;
    const next = applyReviewOutcome({ rating: 80, reviewStreak: 0, lastReviewedAt }, 'correct', 1, 1, now);
    expect(next.rating).toBeLessThan(90);
  });
});
