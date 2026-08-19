import { describe, expect, it } from 'vitest';
import { ratingColor } from './ratingColor';

describe('ratingColor', () => {
  it('green when >= 67', () => {
    expect(ratingColor(67)).toBe('green');
    expect(ratingColor(100)).toBe('green');
  });

  it('yellow when 34..66', () => {
    expect(ratingColor(34)).toBe('yellow');
    expect(ratingColor(66)).toBe('yellow');
  });

  it('red when < 34', () => {
    expect(ratingColor(33)).toBe('red');
    expect(ratingColor(0)).toBe('red');
  });
});
