import { describe, expect, it } from 'vitest';
import { matchAnswer } from './fuzzyMatch';

describe('matchAnswer', () => {
  it('точное совпадение — correct', () => {
    expect(matchAnswer('привет', 'привет')).toBe('correct');
  });

  it('регистр и пробелы по краям не влияют на результат', () => {
    expect(matchAnswer('  Привет  ', 'привет')).toBe('correct');
  });

  it('одна опечатка в коротком слове — almost', () => {
    expect(matchAnswer('кот', 'код')).toBe('almost');
  });

  it('одна опечатка в длинном слове — almost', () => {
    expect(matchAnswer('путешествие', 'путешествия')).toBe('almost');
  });

  it('совсем другое слово — wrong', () => {
    expect(matchAnswer('собака', 'кот')).toBe('wrong');
  });

  it('пустой ввод — wrong', () => {
    expect(matchAnswer('', 'привет')).toBe('wrong');
  });
});
