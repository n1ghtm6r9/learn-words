import { describe, expect, it } from 'vitest';
import { retrievability } from './retrievability';
import { MIN_STABILITY_DAYS, TARGET_RETENTION } from './memoryParams';

describe('retrievability', () => {
  it('is certain the moment a word is reviewed', () => {
    expect(retrievability(0, 10)).toBe(1);
  });

  it('hits the target retention exactly at the end of the scheduled interval', () => {
    expect(retrievability(1, 1)).toBeCloseTo(TARGET_RETENTION, 10);
    expect(retrievability(365, 365)).toBeCloseTo(TARGET_RETENTION, 10);
  });

  it('falls monotonically as time passes', () => {
    const points = [0, 1, 5, 20, 100, 500].map((days) => retrievability(days, 10));

    expect(points).toEqual([...points].sort((a, b) => b - a));
  });

  it('never reaches zero, because memory fades rather than vanishes', () => {
    expect(retrievability(100_000, 1)).toBeGreaterThan(0);
  });

  it('treats a negative elapsed time as no time at all', () => {
    expect(retrievability(-50, 10)).toBe(1);
  });

  it('floors an unusably small stability instead of dividing by zero', () => {
    expect(retrievability(MIN_STABILITY_DAYS, 0)).toBeCloseTo(TARGET_RETENTION, 10);
    expect(retrievability(1, 0)).toBeCloseTo(0.7183, 4);
  });
});
