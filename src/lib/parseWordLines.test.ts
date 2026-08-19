import { describe, expect, it } from 'vitest';
import { parseWordLines } from './parseWordLines';

describe('parseWordLines', () => {
  it('parses lines by hyphen', () => {
    const result = parseWordLines('hello - привет\ncat - кот');
    expect(result.valid).toEqual([
      { term: 'hello', translation: 'привет' },
      { term: 'cat', translation: 'кот' },
    ]);
    expect(result.invalidLines).toHaveLength(0);
  });

  it('supports different separators: em dash, en dash, =, :, tab', () => {
    const result = parseWordLines('a - b\nc – d\ne — f\ng=h\ni:j\nk\tl');
    expect(result.valid).toEqual([
      { term: 'a', translation: 'b' },
      { term: 'c', translation: 'd' },
      { term: 'e', translation: 'f' },
      { term: 'g', translation: 'h' },
      { term: 'i', translation: 'j' },
      { term: 'k', translation: 'l' },
    ]);
  });

  it('trims whitespace around the word and translation', () => {
    const result = parseWordLines('  hello   -   привет  ');
    expect(result.valid).toEqual([{ term: 'hello', translation: 'привет' }]);
  });

  it('uses the first separator occurrence, the rest goes into the translation', () => {
    const result = parseWordLines('well-known - хорошо известный');
    expect(result.valid).toEqual([{ term: 'well', translation: 'known - хорошо известный' }]);
  });

  it('ignores empty lines', () => {
    const result = parseWordLines('hello - привет\n\n\ncat - кот');
    expect(result.valid).toHaveLength(2);
  });

  it('marks lines without a separator as invalid', () => {
    const result = parseWordLines('hello privet');
    expect(result.valid).toHaveLength(0);
    expect(result.invalidLines).toEqual(['hello privet']);
  });

  it('marks lines with an empty part (before or after the separator) as invalid', () => {
    const result = parseWordLines('hello -\n- привет');
    expect(result.valid).toHaveLength(0);
    expect(result.invalidLines).toEqual(['hello -', '- привет']);
  });
});
