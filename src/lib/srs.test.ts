import { describe, expect, it } from 'vitest';
import { nextSrsState, qualityFromVerdict, selectDueWords, type SrsState } from './srs';
import type { Word } from '../db/word.type';

describe('nextSrsState', () => {
  const initial: SrsState = { easinessFactor: 2.5, interval: 0, repetitions: 0 };

  it('первый верный ответ (quality=5) даёт интервал 1 день', () => {
    const next = nextSrsState(initial, 5);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(1);
    expect(next.easinessFactor).toBeCloseTo(2.6, 5);
  });

  it('второй подряд верный ответ даёт интервал 6 дней', () => {
    const afterFirst = nextSrsState(initial, 5);
    const afterSecond = nextSrsState(afterFirst, 5);
    expect(afterSecond.interval).toBe(6);
    expect(afterSecond.repetitions).toBe(2);
  });

  it('третий подряд верный ответ умножает интервал на easinessFactor', () => {
    const s1 = nextSrsState(initial, 5);
    const s2 = nextSrsState(s1, 5);
    const s3 = nextSrsState(s2, 5);
    expect(s3.interval).toBe(Math.round(6 * s2.easinessFactor));
    expect(s3.repetitions).toBe(3);
  });

  it('quality=4 ("почти") не меняет easinessFactor', () => {
    const next = nextSrsState(initial, 4);
    expect(next.easinessFactor).toBeCloseTo(2.5, 5);
  });

  it('неверный ответ (quality<3) сбрасывает repetitions и interval, снижает EF', () => {
    const learned = nextSrsState(nextSrsState(initial, 5), 5);
    const afterWrong = nextSrsState(learned, 2);

    expect(afterWrong.repetitions).toBe(0);
    expect(afterWrong.interval).toBe(1);
    expect(afterWrong.easinessFactor).toBeLessThan(learned.easinessFactor);
  });

  it('easinessFactor никогда не опускается ниже 1.3', () => {
    let state = initial;
    for (let i = 0; i < 20; i++) {
      state = nextSrsState(state, 0);
    }
    expect(state.easinessFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('qualityFromVerdict', () => {
  it('сопоставляет вердикт с SM-2 качеством ответа', () => {
    expect(qualityFromVerdict('correct')).toBe(5);
    expect(qualityFromVerdict('almost')).toBe(4);
    expect(qualityFromVerdict('wrong')).toBe(2);
  });
});

describe('selectDueWords', () => {
  function makeWord(id: number, dueDate: number): Word {
    return {
      id,
      term: `word-${id}`,
      translation: `перевод-${id}`,
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate,
    };
  }

  it('выбирает только слова с dueDate <= now', () => {
    const now = 1000;
    const words = [makeWord(1, 500), makeWord(2, 1500), makeWord(3, 1000)];
    const due = selectDueWords(words, now);
    expect(due.map((w) => w.id)).toEqual([1, 3]);
  });

  it('сортирует просроченные слова по dueDate по возрастанию', () => {
    const now = 1000;
    const words = [makeWord(1, 900), makeWord(2, 100), makeWord(3, 500)];
    const due = selectDueWords(words, now);
    expect(due.map((w) => w.id)).toEqual([2, 3, 1]);
  });

  it('ограничивает количество слов параметром limit', () => {
    const now = 1000;
    const words = [makeWord(1, 100), makeWord(2, 200), makeWord(3, 300)];
    const due = selectDueWords(words, now, 2);
    expect(due).toHaveLength(2);
  });
});
