import { describe, expect, it } from 'vitest';
import { matchAnswer } from './fuzzyMatch';

describe('matchAnswer', () => {
  it('exact match — correct', () => {
    expect(matchAnswer('привет', 'привет')).toBe('correct');
  });

  it('case and surrounding whitespace do not affect the result', () => {
    expect(matchAnswer('  Привет  ', 'привет')).toBe('correct');
  });

  it('one typo in a short word — almost', () => {
    expect(matchAnswer('кот', 'код')).toBe('almost');
  });

  it('one typo in a long word — almost', () => {
    expect(matchAnswer('путешествие', 'путешествия')).toBe('almost');
  });

  it('completely different word — wrong', () => {
    expect(matchAnswer('собака', 'кот')).toBe('wrong');
  });

  it('empty input — wrong', () => {
    expect(matchAnswer('', 'привет')).toBe('wrong');
  });
});
