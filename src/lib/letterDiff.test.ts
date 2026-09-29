import { describe, expect, it } from 'vitest';
import { letterDiff } from './letterDiff';

describe('letterDiff', () => {
  it('marks nothing when the attempt matches the word', () => {
    expect(letterDiff('apple', 'apple')).toEqual({
      attempt: [{ text: 'apple', changed: false }],
      expected: [{ text: 'apple', changed: false }],
    });
  });

  it('marks a letter missing from the attempt in the expected word', () => {
    expect(letterDiff('aple', 'apple')).toEqual({
      attempt: [{ text: 'aple', changed: false }],
      expected: [
        { text: 'ap', changed: false },
        { text: 'p', changed: true },
        { text: 'le', changed: false },
      ],
    });
  });

  it('marks an extra letter in the attempt', () => {
    expect(letterDiff('appple', 'apple')).toEqual({
      attempt: [
        { text: 'app', changed: false },
        { text: 'p', changed: true },
        { text: 'le', changed: false },
      ],
      expected: [{ text: 'apple', changed: false }],
    });
  });

  it('marks a replaced letter on both sides', () => {
    expect(letterDiff('cot', 'cat')).toEqual({
      attempt: [
        { text: 'c', changed: false },
        { text: 'o', changed: true },
        { text: 't', changed: false },
      ],
      expected: [
        { text: 'c', changed: false },
        { text: 'a', changed: true },
        { text: 't', changed: false },
      ],
    });
  });

  it('marks swapped letters as one extra and one missing letter', () => {
    const diff = letterDiff('recieve', 'receive');

    expect(diff.attempt.filter((part) => part.changed).map((part) => part.text).join('')).toHaveLength(1);
    expect(diff.expected.filter((part) => part.changed).map((part) => part.text).join('')).toHaveLength(1);
    expect(diff.attempt.map((part) => part.text).join('')).toBe('recieve');
    expect(diff.expected.map((part) => part.text).join('')).toBe('receive');
  });

  it('compares letters case-insensitively but keeps the original case for display', () => {
    expect(letterDiff('LONDN', 'London')).toEqual({
      attempt: [{ text: 'LONDN', changed: false }],
      expected: [
        { text: 'Lond', changed: false },
        { text: 'o', changed: true },
        { text: 'n', changed: false },
      ],
    });
  });

  it('ignores surrounding whitespace', () => {
    expect(letterDiff('  apple ', 'apple')).toEqual({
      attempt: [{ text: 'apple', changed: false }],
      expected: [{ text: 'apple', changed: false }],
    });
  });

  it('marks trailing letters that have no counterpart', () => {
    expect(letterDiff('cats', 'cat')).toEqual({
      attempt: [
        { text: 'cat', changed: false },
        { text: 's', changed: true },
      ],
      expected: [{ text: 'cat', changed: false }],
    });
    expect(letterDiff('ca', 'cat').expected).toEqual([
      { text: 'ca', changed: false },
      { text: 't', changed: true },
    ]);
  });

  it('keeps multi-word phrases and non-latin letters intact', () => {
    expect(letterDiff('ice crem', 'ice cream').expected).toEqual([
      { text: 'ice cre', changed: false },
      { text: 'a', changed: true },
      { text: 'm', changed: false },
    ]);
    expect(letterDiff('кот', 'код').expected).toEqual([
      { text: 'ко', changed: false },
      { text: 'д', changed: true },
    ]);
  });

  it('returns empty parts for an empty attempt and marks the whole word as missing', () => {
    expect(letterDiff('', 'cat')).toEqual({
      attempt: [],
      expected: [{ text: 'cat', changed: true }],
    });
  });
});
