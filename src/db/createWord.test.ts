import { describe, expect, it } from 'vitest';
import { createWord } from './createWord';

describe('createWord', () => {
  it('создаёт слово, готовое к Фазе A', () => {
    const word = createWord('hello', 'привет');

    expect(word.term).toBe('hello');
    expect(word.translation).toBe('привет');
    expect(word.stage).toBe('new');
    expect(word.learningPhase).toBe('A');
    expect(word.phaseStreak).toBe(0);
  });
});
