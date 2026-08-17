import { describe, expect, it } from 'vitest';
import { masteryStatus } from './mastery';

describe('masteryStatus', () => {
  it('returns "new" for a word that has never been reviewed', () => {
    expect(masteryStatus(0)).toBe('new');
  });

  it('returns "learning" for a word with a short interval', () => {
    expect(masteryStatus(6)).toBe('learning');
  });

  it('returns "mastered" once the interval reaches the threshold', () => {
    expect(masteryStatus(21)).toBe('mastered');
    expect(masteryStatus(40)).toBe('mastered');
  });

  it('respects a custom threshold', () => {
    expect(masteryStatus(10, 10)).toBe('mastered');
    expect(masteryStatus(9, 10)).toBe('learning');
  });
});
