import { describe, expect, it } from 'vitest';
import { detectWordKind } from './detectWordKind';

describe('detectWordKind', () => {
  it('распознаёт одиночное слово', () => {
    expect(detectWordKind('apple')).toBe('word');
  });

  it('распознаёт дефисное составное слово как слово', () => {
    expect(detectWordKind('well-known')).toBe('word');
  });

  it('распознаёт фразовый глагол как слово, а не фразу', () => {
    expect(detectWordKind('give up')).toBe('word');
    expect(detectWordKind('look after')).toBe('word');
    expect(detectWordKind('turn on')).toBe('word');
    expect(detectWordKind('wake up')).toBe('word');
  });

  it('фразовый глагол распознаётся без учёта регистра частицы', () => {
    expect(detectWordKind('Give Up')).toBe('word');
  });

  it('распознаёт двухсловное словосочетание, не являющееся фразовым глаголом, как фразу', () => {
    expect(detectWordKind('New York')).toBe('phrase');
    expect(detectWordKind('good morning')).toBe('phrase');
  });

  it('распознаёт словосочетание из нескольких слов как фразу', () => {
    expect(detectWordKind('as soon as possible')).toBe('phrase');
  });

  it('трёхсловный фразовый глагол (phrasal-prepositional) распознаётся как фраза', () => {
    expect(detectWordKind('look forward to')).toBe('phrase');
  });

  it('игнорирует лишние пробелы по краям и между словами', () => {
    expect(detectWordKind('  apple  ')).toBe('word');
    expect(detectWordKind('give    up')).toBe('word');
    expect(detectWordKind('good    morning')).toBe('phrase');
  });
});
