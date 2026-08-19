import { describe, expect, it } from 'vitest';
import { createWord } from './createWord';

describe('createWord', () => {
  it('creates a word ready for Phase A', () => {
    const word = createWord('hello', 'привет');

    expect(word.term).toBe('hello');
    expect(word.translation).toBe('привет');
    expect(word.stage).toBe('new');
    expect(word.learningPhase).toBe('A');
    expect(word.phaseStreak).toBe(0);
    expect(word.kind).toBe('word');
  });

  it('recognizes a word combination as a phrase', () => {
    const word = createWord('as soon as possible', 'как можно скорее');

    expect(word.kind).toBe('phrase');
  });

  it('recognizes a phrasal verb as a word, not a phrase', () => {
    const word = createWord('give up', 'сдаваться');

    expect(word.kind).toBe('word');
  });
});
