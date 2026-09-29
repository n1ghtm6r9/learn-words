import { describe, expect, it } from 'vitest';
import { accuracyPercent } from './accuracyPercent';

describe('accuracyPercent', () => {
  it('is the share of correct answers rounded to a whole percent', () => {
    expect(accuracyPercent(2, 3)).toBe(67);
    expect(accuracyPercent(1, 3)).toBe(33);
    expect(accuracyPercent(5, 5)).toBe(100);
    expect(accuracyPercent(0, 4)).toBe(0);
  });

  it('is zero when nothing was answered', () => {
    expect(accuracyPercent(0, 0)).toBe(0);
  });

  it('never goes above 100', () => {
    expect(accuracyPercent(4, 3)).toBe(100);
  });
});
