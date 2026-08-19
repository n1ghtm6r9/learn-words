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

  it('uses the first padded separator occurrence, the rest goes into the translation', () => {
    const result = parseWordLines('well known - so - so - хорошо известный');
    expect(result.valid).toEqual([{ term: 'well known', translation: 'so - so - хорошо известный' }]);
  });

  it('does not split a hyphen that is part of a compound word (no surrounding whitespace)', () => {
    const result = parseWordLines(
      'well-being - благополучие\ne-mail - электронная почта\nmother-in-law - тёща',
    );
    expect(result.valid).toEqual([
      { term: 'well-being', translation: 'благополучие' },
      { term: 'e-mail', translation: 'электронная почта' },
      { term: 'mother-in-law', translation: 'тёща' },
    ]);
    expect(result.invalidLines).toHaveLength(0);
  });

  it('still splits on unpadded = and : (unambiguous, unlike hyphen)', () => {
    const result = parseWordLines('g=h\ni:j');
    expect(result.valid).toEqual([
      { term: 'g', translation: 'h' },
      { term: 'i', translation: 'j' },
    ]);
  });

  it('strips a leading list marker (bullet or number) before parsing', () => {
    const result = parseWordLines('- hello - привет\n• cat - кот\n1. dog - собака\n2) bird - птица');
    expect(result.valid).toEqual([
      { term: 'hello', translation: 'привет' },
      { term: 'cat', translation: 'кот' },
      { term: 'dog', translation: 'собака' },
      { term: 'bird', translation: 'птица' },
    ]);
    expect(result.invalidLines).toHaveLength(0);
  });

  it('rejects a term with no letters (punctuation-only) as invalid', () => {
    const result = parseWordLines('. - точка\n?? - вопрос');
    expect(result.valid).toHaveLength(0);
    expect(result.invalidLines).toEqual(['. - точка', '?? - вопрос']);
  });

  it('normalizes messy pasted text: smart quotes, extra spaces, invisible characters', () => {
    const result = parseWordLines('“hello”   -   привет');
    expect(result.valid).toEqual([{ term: 'hello', translation: 'привет' }]);
  });

  it('splits on line separators other than \\n instead of merging words together', () => {
    const lineSeparator = String.fromCodePoint(0x2028);
    const result = parseWordLines(`hello - привет${lineSeparator}cat - кот`);

    expect(result.valid).toEqual([
      { term: 'hello', translation: 'привет' },
      { term: 'cat', translation: 'кот' },
    ]);
  });

  it('splits on a lone carriage return', () => {
    const result = parseWordLines('hello - привет\rcat - кот');

    expect(result.valid).toHaveLength(2);
  });

  it('does not treat a colon between digits as a separator', () => {
    const result = parseWordLines('9:00 - девять часов');

    expect(result.valid).toEqual([{ term: '9:00', translation: 'девять часов' }]);
  });

  it('splits on a colon even when the translation contains a spaced dash', () => {
    const result = parseWordLines('cat: кот - животное');

    expect(result.valid).toEqual([{ term: 'cat', translation: 'кот - животное' }]);
  });

  it('strips bullet markers used by common editors', () => {
    const result = parseWordLines('● hello - привет\n◦ cat - кот');

    expect(result.valid).toEqual([
      { term: 'hello', translation: 'привет' },
      { term: 'cat', translation: 'кот' },
    ]);
  });

  it('keeps a leading hyphen that belongs to a suffix entry', () => {
    const result = parseWordLines('-ing - окончание\n-ся = частица');

    expect(result.valid).toEqual([
      { term: '-ing', translation: 'окончание' },
      { term: '-ся', translation: 'частица' },
    ]);
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
