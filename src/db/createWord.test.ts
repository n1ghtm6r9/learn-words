import { describe, expect, it } from 'vitest';
import { createWord } from './createWord';

describe('createWord', () => {
  it('creates a word with default SRS state due immediately', () => {
    const before = Date.now();
    const word = createWord('hello', 'привет');
    const after = Date.now();

    expect(word.term).toBe('hello');
    expect(word.translation).toBe('привет');
    expect(word.easinessFactor).toBe(2.5);
    expect(word.interval).toBe(0);
    expect(word.repetitions).toBe(0);
    expect(word.dueDate).toBeGreaterThanOrEqual(before);
    expect(word.dueDate).toBeLessThanOrEqual(after);
  });
});
