import { describe, expect, it } from 'vitest';
import { releaseVelocity } from './releaseVelocity';

describe('releaseVelocity', () => {
  it('measures the speed over the last hundred milliseconds', () => {
    const samples = [
      { y: 0, time: 0 },
      { y: 10, time: 100 },
      { y: 40, time: 150 },
      { y: 100, time: 200 },
    ];
    expect(releaseVelocity(samples, 210)).toBeCloseTo(0.9);
  });

  it('is zero when the finger rested before release', () => {
    expect(releaseVelocity([{ y: 0, time: 0 }, { y: 50, time: 20 }], 300)).toBe(0);
  });

  it('is zero without enough samples', () => {
    expect(releaseVelocity([], 10)).toBe(0);
    expect(releaseVelocity([{ y: 40, time: 5 }], 10)).toBe(0);
  });

  it('is negative for an upward flick', () => {
    expect(releaseVelocity([{ y: 100, time: 0 }, { y: 40, time: 60 }], 70)).toBeCloseTo(-1);
  });
});
