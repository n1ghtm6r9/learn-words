import { describe, expect, it } from 'vitest';
import { detectWordKind } from './detectWordKind';

describe('detectWordKind', () => {
  it('recognizes a single word', () => {
    expect(detectWordKind('apple')).toBe('word');
  });

  it('recognizes a hyphenated compound word as a word', () => {
    expect(detectWordKind('well-known')).toBe('word');
  });

  it('recognizes a phrasal verb as a word, not a phrase', () => {
    expect(detectWordKind('give up')).toBe('word');
    expect(detectWordKind('look after')).toBe('word');
    expect(detectWordKind('turn on')).toBe('word');
    expect(detectWordKind('wake up')).toBe('word');
  });

  it('recognizes a phrasal verb regardless of particle case', () => {
    expect(detectWordKind('Give Up')).toBe('word');
  });

  it('recognizes a two-word combination that is not a phrasal verb as a phrase', () => {
    expect(detectWordKind('New York')).toBe('phrase');
    expect(detectWordKind('good morning')).toBe('phrase');
  });

  it('recognizes a multi-word combination as a phrase', () => {
    expect(detectWordKind('as soon as possible')).toBe('phrase');
  });

  it('recognizes a three-word phrasal-prepositional verb as a phrase', () => {
    expect(detectWordKind('look forward to')).toBe('phrase');
  });

  it('ignores extra whitespace around and between words', () => {
    expect(detectWordKind('  apple  ')).toBe('word');
    expect(detectWordKind('give    up')).toBe('word');
    expect(detectWordKind('good    morning')).toBe('phrase');
  });
});
