import { describe, expect, it } from 'vitest';
import { normalizeTerm } from './normalizeTerm';

describe('normalizeTerm', () => {
  it('keeps a trailing apostrophe that belongs to the word', () => {
    expect(normalizeTerm("boys'")).toBe("boys'");
    expect(normalizeTerm("'tis")).toBe("'tis");
    expect(normalizeTerm("rock 'n'")).toBe("rock 'n'");
  });

  it('strips only a matched pair of wrapping quotes', () => {
    expect(normalizeTerm('"hello"')).toBe('hello');
    expect(normalizeTerm("'hello'")).toBe('hello');
    expect(normalizeTerm('" \'good morning\' "')).toBe('good morning');
  });

  it('is idempotent, so a re-normalized term stays identical', () => {
    for (const input of ['" \'cat\' "', "''x''", '"  spaced  "', "boys'", '“quoted”']) {
      const once = normalizeTerm(input);
      expect(normalizeTerm(once)).toBe(once);
    }
  });

  it('preserves zero-width joiners that carry meaning', () => {
    const persian = 'می‌رود';
    const family = '👨‍👩‍👧';
    expect(normalizeTerm(persian)).toBe(persian);
    expect(normalizeTerm(family)).toBe(family);
  });

  it('leaves a clean word untouched', () => {
    expect(normalizeTerm('hello')).toBe('hello');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeTerm('  hello  ')).toBe('hello');
  });

  it('collapses internal whitespace runs to a single space', () => {
    expect(normalizeTerm('good    morning')).toBe('good morning');
  });

  it('removes zero-width and other invisible characters', () => {
    expect(normalizeTerm('​hello​')).toBe('hello');
    expect(normalizeTerm('hel­lo')).toBe('hello');
  });

  it('collapses non-breaking spaces to a regular space', () => {
    expect(normalizeTerm('New York')).toBe('New York');
    expect(normalizeTerm('New York')).toBe('New York');
  });

  it('folds curly quotes to straight quotes', () => {
    expect(normalizeTerm('‘hello’')).toBe('hello');
    expect(normalizeTerm('“hello”')).toBe('hello');
  });

  it('strips wrapping quote characters left after folding', () => {
    expect(normalizeTerm('"hello"')).toBe('hello');
    expect(normalizeTerm("'hello'")).toBe('hello');
  });

  it('normalizes to NFC so combining-character forms match precomposed ones', () => {
    const nfd = 'é'.normalize('NFD');
    expect(normalizeTerm(nfd)).toBe('é'.normalize('NFC'));
  });

  it('does not strip internal punctuation, only wrapping quotes', () => {
    expect(normalizeTerm('well-known')).toBe('well-known');
    expect(normalizeTerm('etc.')).toBe('etc.');
  });
});
