import { describe, expect, it } from 'vitest';
import { effectiveRating } from './effectiveRating';
import { DAY_MS } from './time';
import type { MemoryState } from './memoryState.type';

const NOW = 1_700_000_000_000;

function state(overrides: Partial<MemoryState> = {}): MemoryState {
  return { stability: 10, difficulty: 5, reviewStreak: 0, lastReviewedAt: NOW, ...overrides };
}

describe('effectiveRating', () => {
  it('is 100 right after a review, when recall is certain', () => {
    expect(effectiveRating(state(), NOW)).toBe(100);
  });

  it('is exactly 90 once a word reaches its scheduled interval', () => {
    expect(effectiveRating(state({ stability: 10 }), NOW + 10 * DAY_MS)).toBe(90);
    expect(effectiveRating(state({ stability: 200 }), NOW + 200 * DAY_MS)).toBe(90);
  });

  it('keeps falling past the scheduled interval', () => {
    const atInterval = effectiveRating(state({ stability: 10 }), NOW + 10 * DAY_MS);
    const wellPast = effectiveRating(state({ stability: 10 }), NOW + 100 * DAY_MS);

    expect(wellPast).toBeLessThan(atInterval);
    expect(wellPast).toBeGreaterThan(0);
  });

  it('decays more slowly for a word with higher stability, which is the whole point of earning it', () => {
    const after30Days = NOW + 30 * DAY_MS;
    const fragile = effectiveRating(state({ stability: 2 }), after30Days);
    const solid = effectiveRating(state({ stability: 60 }), after30Days);

    expect(solid).toBeGreaterThan(fragile);
    expect(fragile).toBeLessThan(50);
    expect(solid).toBeGreaterThan(90);
  });

  it('reports 0 for a word that has never been reviewed', () => {
    expect(effectiveRating(state({ lastReviewedAt: undefined }), NOW)).toBe(0);
  });

  it('never reads above 100 when the clock jumps backwards', () => {
    expect(effectiveRating(state(), NOW - 5 * DAY_MS)).toBe(100);
  });

  it('reports the rating to two decimals', () => {
    expect(effectiveRating(state({ stability: 7 }), NOW + 3 * DAY_MS)).toBe(95.32);
  });
});
