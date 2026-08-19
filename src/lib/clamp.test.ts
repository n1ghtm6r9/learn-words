import { describe, expect, it } from 'vitest';
import { clamp } from './clamp';

describe('clamp', () => {
  it('returns the value unchanged when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the minimum when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to the maximum when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns the minimum for NaN instead of propagating it', () => {
    expect(clamp(NaN, 0, 10)).toBe(0);
  });

  it('clamps infinite values to the nearer bound rather than flipping them', () => {
    expect(clamp(Infinity, 0, 10)).toBe(10);
    expect(clamp(-Infinity, 0, 10)).toBe(0);
  });
});
