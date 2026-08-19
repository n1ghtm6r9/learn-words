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
    expect(word.kind).toBe('word');
  });

  it('распознаёт словосочетание как фразу', () => {
    const word = createWord('as soon as possible', 'как можно скорее');

    expect(word.kind).toBe('phrase');
  });

  it('распознаёт фразовый глагол как слово, а не фразу', () => {
    const word = createWord('give up', 'сдаваться');

    expect(word.kind).toBe('word');
  });
});
