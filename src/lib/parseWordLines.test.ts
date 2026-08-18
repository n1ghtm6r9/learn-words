import { describe, expect, it } from 'vitest';
import { parseWordLines } from './parseWordLines';

describe('parseWordLines', () => {
  it('разбирает строки по дефису', () => {
    const result = parseWordLines('hello - привет\ncat - кот');
    expect(result.valid).toEqual([
      { term: 'hello', translation: 'привет' },
      { term: 'cat', translation: 'кот' },
    ]);
    expect(result.invalidLines).toHaveLength(0);
  });

  it('поддерживает разные разделители: длинное/короткое тире, =, :, таб', () => {
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

  it('обрезает пробелы по краям слова и перевода', () => {
    const result = parseWordLines('  hello   -   привет  ');
    expect(result.valid).toEqual([{ term: 'hello', translation: 'привет' }]);
  });

  it('использует первое вхождение разделителя, остальное уходит в перевод', () => {
    const result = parseWordLines('well-known - хорошо известный');
    expect(result.valid).toEqual([{ term: 'well', translation: 'known - хорошо известный' }]);
  });

  it('игнорирует пустые строки', () => {
    const result = parseWordLines('hello - привет\n\n\ncat - кот');
    expect(result.valid).toHaveLength(2);
  });

  it('помечает строки без разделителя как невалидные', () => {
    const result = parseWordLines('hello privet');
    expect(result.valid).toHaveLength(0);
    expect(result.invalidLines).toEqual(['hello privet']);
  });

  it('помечает строки с пустой частью (до или после разделителя) как невалидные', () => {
    const result = parseWordLines('hello -\n- привет');
    expect(result.valid).toHaveLength(0);
    expect(result.invalidLines).toEqual(['hello -', '- привет']);
  });
});
