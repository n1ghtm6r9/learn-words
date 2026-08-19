import { describe, expect, it } from 'vitest';
import { speedFactor } from './responseSpeed';

describe('speedFactor', () => {
  it('a fast answer within the expected typing time gets full confidence', () => {
    expect(speedFactor(1000, 5)).toBe(1);
  });

  it('an instant answer still gets full confidence', () => {
    expect(speedFactor(0, 5)).toBe(1);
  });

  it('an answer right at the fast threshold gets full confidence', () => {
    expect(speedFactor(1350, 5)).toBe(1);
  });

  it('an answer halfway between fast and slow gets a partial factor', () => {
    expect(speedFactor(2700, 5)).toBeCloseTo(0.75, 5);
  });

  it('an answer at the slow threshold hits the minimum factor', () => {
    expect(speedFactor(4050, 5)).toBeCloseTo(0.5, 5);
  });

  it('an answer far beyond the slow threshold does not drop below the minimum', () => {
    expect(speedFactor(60000, 5)).toBe(0.5);
  });

  it('longer expected answers get proportionally more time before being considered slow', () => {
    const shortWordSlow = speedFactor(3000, 3);
    const longPhraseSameElapsed = speedFactor(3000, 20);
    expect(longPhraseSameElapsed).toBeGreaterThan(shortWordSlow);
  });
});
