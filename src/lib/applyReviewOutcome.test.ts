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
    expect(next.stage).toBeUndefined();
  });

  it('correct: does not exceed 100', () => {
    const next = applyReviewOutcome({ rating: 95, reviewStreak: 0 }, 'correct', now);
    expect(next.rating).toBe(100);
  });

  it('almost (minor error): rating and streak are unchanged, only the review timestamp moves', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'almost', now);
    expect(next.rating).toBe(50);
    expect(next.reviewStreak).toBe(3);
    expect(next.lastReviewedAt).toBe(now);
  });

  it('almost: crystallizes the effective (decayed) rating rather than the stale stored one', () => {
    const lastReviewedAt = now - 10 * DAY_MS;
    const next = applyReviewOutcome({ rating: 80, reviewStreak: 0, lastReviewedAt }, 'almost', now);
    expect(next.rating).toBeLessThan(80);
  });

  it('wrong (major error): -25 from rating, streak resets', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'wrong', now);
    expect(next.rating).toBe(25);
    expect(next.reviewStreak).toBe(0);
    expect(next.stage).toBeUndefined();
  });

  it('wrong: does not go below 0', () => {
    const next = applyReviewOutcome({ rating: 10, reviewStreak: 0 }, 'wrong', now);
    expect(next.rating).toBe(0);
  });

  it('wrong: a rating that reaches 0 sends the word back to relearning from scratch', () => {
    const next = applyReviewOutcome({ rating: 10, reviewStreak: 4 }, 'wrong', now);
    expect(next.rating).toBe(0);
    expect(next.stage).toBe('new');
    expect(next.learningPhase).toBe('A');
    expect(next.phaseStreak).toBe(0);
    expect(next.reviewStreak).toBe(0);
  });

  it('wrong: a rating that stays above 0 does not trigger relearning', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 0 }, 'wrong', now);
    expect(next.rating).toBe(25);
    expect(next.stage).toBeUndefined();
    expect(next.learningPhase).toBeUndefined();
  });

  it('computes from the effective (decayed) rating, not the stale stored one', () => {
    const lastReviewedAt = now - 10 * DAY_MS;
    const next = applyReviewOutcome({ rating: 80, reviewStreak: 0, lastReviewedAt }, 'correct', now);
    expect(next.rating).toBeLessThan(80);
  });
});
