import { describe, expect, it } from 'vitest';
import { halfLifeDays } from './halfLifeDays';

describe('halfLifeDays', () => {
  it('растёт от reviewStreak: 2 дня при streak=0, 17 дней при streak=5', () => {
    expect(halfLifeDays(0)).toBe(2);
    expect(halfLifeDays(5)).toBe(17);
  });
});
