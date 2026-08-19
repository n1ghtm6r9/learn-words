import { describe, expect, it } from 'vitest';
import { halfLifeDays } from './halfLifeDays';

describe('halfLifeDays', () => {
  it('grows with reviewStreak: 2 days at streak=0, 17 days at streak=5', () => {
    expect(halfLifeDays(0)).toBe(2);
    expect(halfLifeDays(5)).toBe(17);
  });
});
