import { describe, expect, it } from 'vitest';
import { ratingColor } from './ratingColor';

describe('ratingColor', () => {
  it('green при >= 67', () => {
    expect(ratingColor(67)).toBe('green');
    expect(ratingColor(100)).toBe('green');
  });

  it('yellow при 34..66', () => {
    expect(ratingColor(34)).toBe('yellow');
    expect(ratingColor(66)).toBe('yellow');
  });

  it('red при < 34', () => {
    expect(ratingColor(33)).toBe('red');
    expect(ratingColor(0)).toBe('red');
  });
});
