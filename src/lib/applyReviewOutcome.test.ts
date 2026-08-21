import { describe, expect, it } from 'vitest';
import { applyReviewOutcome } from './applyReviewOutcome';
import { INITIAL_STABILITY_DAYS, MAX_STABILITY_DAYS, MIN_STABILITY_DAYS } from './memoryParams';
import { DAY_MS } from './time';
import type { MemoryState } from './memoryState.type';

const NOW = 1_700_000_000_000;

function state(overrides: Partial<MemoryState> = {}): MemoryState {
  return { stability: 10, difficulty: 5, reviewStreak: 0, lastReviewedAt: NOW, ...overrides };
}

function reviewedOnTime(current: MemoryState, verdict: 'correct' | 'almost' | 'wrong', accuracy = 1, speed = 1) {
  return applyReviewOutcome(current, verdict, accuracy, speed, NOW + current.stability * DAY_MS);
}

describe('applyReviewOutcome', () => {
  it('lengthens the interval after a correct answer', () => {
    const next = reviewedOnTime(state({ stability: 10 }), 'correct');

    expect(next.stability).toBeGreaterThan(10);
    expect(next.reviewStreak).toBe(1);
    expect(next.lastReviewedAt).toBe(NOW + 10 * DAY_MS);
  });

  it('keeps stretching the interval review after review, so a known word stops coming up', () => {
    let current = state({ stability: INITIAL_STABILITY_DAYS });
    const intervals: number[] = [];

    for (let i = 0; i < 10; i++) {
      const dueAt = current.lastReviewedAt! + current.stability * DAY_MS;
      const next = applyReviewOutcome(current, 'correct', 1, 1, dueAt);
      intervals.push(next.stability);
      current = { ...current, ...next };
    }

    expect(intervals).toEqual([...intervals].sort((a, b) => a - b));
    expect(intervals.at(-1)).toBeGreaterThan(60);
  });

  it('rewards recalling a word you nearly forgot more than one caught right on time', () => {
    const base = state({ stability: 20 });
    const onTime = applyReviewOutcome(base, 'correct', 1, 1, NOW + 20 * DAY_MS);
    const longOverdue = applyReviewOutcome(base, 'correct', 1, 1, NOW + 60 * DAY_MS);

    expect(onTime.stability).toBeGreaterThan(20);
    expect(longOverdue.stability).toBeGreaterThan(onTime.stability * 1.3);
  });

  it('holds the growth curve down as a word gets strong, instead of running away', () => {
    let current = state({ stability: INITIAL_STABILITY_DAYS });

    for (let i = 0; i < 10; i++) {
      const dueAt = current.lastReviewedAt! + current.stability * DAY_MS;
      current = { ...current, ...applyReviewOutcome(current, 'correct', 1, 1, dueAt) };
    }

    expect(current.stability).toBeGreaterThan(60);
    expect(current.stability).toBeLessThan(150);
  });

  it('never lets a mistake lengthen the interval, at any stability or difficulty', () => {
    for (const stability of [0.25, 0.3, 1, 5, 60]) {
      for (const difficulty of [1, 2.7, 5, 10]) {
        const before = state({ stability, difficulty });
        const after = applyReviewOutcome(before, 'wrong', 0, 1, NOW + stability * DAY_MS);
        if (after.stage === 'new') continue;
        expect(after.stability).toBeLessThanOrEqual(stability);
      }
    }
  });

  it('keeps a merely shaky word in review instead of demoting it on one mistake', () => {
    const shaky = applyReviewOutcome(state({ stability: 0.3, difficulty: 5 }), 'wrong', 0, 1, NOW + DAY_MS);

    expect(shaky.stage).toBeUndefined();
  });

  it('grows a hard-won word less than an effortless one', () => {
    const slow = reviewedOnTime(state(), 'correct', 1, 0.5);
    const fast = reviewedOnTime(state(), 'correct', 1, 1);

    expect(fast.stability).toBeGreaterThan(slow.stability);
  });

  it('grows far less after a one-letter slip than after a clean answer', () => {
    const almost = reviewedOnTime(state(), 'almost');
    const correct = reviewedOnTime(state(), 'correct');

    expect(almost.stability).toBeGreaterThan(10);
    expect(almost.stability).toBeLessThan(correct.stability);
  });

  it('keeps the streak on a minor slip but breaks it on a real mistake', () => {
    expect(reviewedOnTime(state({ reviewStreak: 4 }), 'almost').reviewStreak).toBe(4);
    expect(reviewedOnTime(state({ reviewStreak: 4 }), 'wrong', 0.2).reviewStreak).toBe(0);
  });

  it('collapses the interval after a real mistake', () => {
    const next = reviewedOnTime(state({ stability: 60 }), 'wrong', 0.2);

    expect(next.stability).toBeLessThan(10);
    expect(next.stability).toBeGreaterThanOrEqual(MIN_STABILITY_DAYS);
  });

  it('does not throw away everything a long-known word had earned when it lapses', () => {
    const seasoned = reviewedOnTime(state({ stability: 200 }), 'wrong', 0.2);
    const fresh = reviewedOnTime(state({ stability: 1 }), 'wrong', 0.2);

    expect(seasoned.stability).toBeGreaterThan(fresh.stability);
  });

  it('makes an easy word easier and a missed word harder', () => {
    expect(reviewedOnTime(state({ difficulty: 5 }), 'correct').difficulty).toBeLessThan(5);
    expect(reviewedOnTime(state({ difficulty: 5 }), 'wrong', 0.1).difficulty).toBeGreaterThan(5);
  });

  it('punishes a wild guess harder than a near miss', () => {
    const nearMiss = reviewedOnTime(state(), 'wrong', 0.8);
    const wildGuess = reviewedOnTime(state(), 'wrong', 0);

    expect(wildGuess.difficulty).toBeGreaterThan(nearMiss.difficulty);
  });

  it('holds a difficult word to shorter intervals than an easy one', () => {
    const easy = reviewedOnTime(state({ difficulty: 2 }), 'correct');
    const hard = reviewedOnTime(state({ difficulty: 9 }), 'correct');

    expect(easy.stability).toBeGreaterThan(hard.stability);
  });

  it('sends a word nobody can hold on to back to learning from scratch', () => {
    let current = state({ stability: 1, difficulty: 9.5 });
    let outcome = reviewedOnTime(current, 'wrong', 0);

    for (let i = 0; i < 5 && outcome.stage !== 'new'; i++) {
      current = { ...current, ...outcome };
      outcome = applyReviewOutcome(current, 'wrong', 0, 1, NOW + (i + 2) * DAY_MS);
    }

    expect(outcome.stage).toBe('new');
    expect(outcome.learningPhase).toBe('A');
    expect(outcome.phaseStreak).toBe(0);
    expect(outcome.stability).toBe(INITIAL_STABILITY_DAYS);
  });

  it('keeps a well-known word in review rather than demoting it on a single slip', () => {
    const next = reviewedOnTime(state({ stability: 120, difficulty: 3 }), 'wrong', 0.2);

    expect(next.stage).toBeUndefined();
  });

  it('never lets the interval run past the ceiling or under the floor', () => {
    const huge = reviewedOnTime(state({ stability: MAX_STABILITY_DAYS, difficulty: 1 }), 'correct');
    const tiny = reviewedOnTime(state({ stability: MIN_STABILITY_DAYS, difficulty: 10 }), 'wrong', 0);

    expect(huge.stability).toBeLessThanOrEqual(MAX_STABILITY_DAYS);
    expect(tiny.stability).toBeGreaterThanOrEqual(MIN_STABILITY_DAYS);
  });

  it('gives no credit for a correct answer before the word was due, so practice cannot inflate the schedule', () => {
    const before = state({ stability: 30, difficulty: 4, reviewStreak: 3 });
    const next = applyReviewOutcome(before, 'correct', 1, 1, NOW + 5 * DAY_MS);

    expect(next.stability).toBe(30);
    expect(next.difficulty).toBe(4);
    expect(next.reviewStreak).toBe(3);
    expect(next.lastReviewedAt).toBe(NOW);
  });

  it('does not let repeated early practice drift the schedule at all', () => {
    let current = state({ stability: 30 });

    for (let day = 1; day <= 20; day++) {
      current = { ...current, ...applyReviewOutcome(current, 'correct', 1, 1, NOW + day * DAY_MS) };
    }

    expect(current.stability).toBe(30);
    expect(current.lastReviewedAt).toBe(NOW);
  });

  it('still counts a mistake made before the word was due', () => {
    const next = applyReviewOutcome(state({ stability: 30 }), 'wrong', 0.2, 1, NOW + 5 * DAY_MS);

    expect(next.stability).toBeLessThan(30);
    expect(next.lastReviewedAt).toBe(NOW + 5 * DAY_MS);
  });

  it('treats a word with no review history as due now, so the first answer actually counts', () => {
    const next = applyReviewOutcome(
      { stability: INITIAL_STABILITY_DAYS, difficulty: 5, reviewStreak: 0 },
      'correct',
      1,
      1,
      NOW,
    );

    expect(next.stability).toBeCloseTo(1.96, 2);
    expect(next.lastReviewedAt).toBe(NOW);
  });
});
