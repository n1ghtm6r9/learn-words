import { describe, expect, it } from 'vitest';
import { computeAccuracy, computeStreak, countMastered, last30DaysActivity } from './stats';
import { DAY_MS } from './srs';
import type { ReviewLog, Word } from '../db/db';

const NOW = Date.parse('2026-08-17T12:00:00.000Z');

function review(reviewedAt: number, correct: boolean): ReviewLog {
  return { wordId: 1, reviewedAt, correct };
}

describe('computeAccuracy', () => {
  it('считает процент верных ответов за последние N дней', () => {
    const reviews = [
      review(NOW, true),
      review(NOW, true),
      review(NOW, false),
      review(NOW, true),
    ];
    expect(computeAccuracy(reviews, 7, NOW)).toBe(75);
  });

  it('игнорирует ответы за пределами окна', () => {
    const reviews = [
      review(NOW, false),
      review(NOW - 10 * DAY_MS, true),
    ];
    expect(computeAccuracy(reviews, 7, NOW)).toBe(0);
  });

  it('возвращает 0, если ответов не было', () => {
    expect(computeAccuracy([], 7, NOW)).toBe(0);
  });
});

describe('computeStreak', () => {
  it('считает подряд идущие дни с ответами, включая сегодня', () => {
    const reviews = [
      review(NOW, true),
      review(NOW - 1 * DAY_MS, true),
      review(NOW - 2 * DAY_MS, false),
    ];
    expect(computeStreak(reviews, NOW)).toBe(3);
  });

  it('обрывает streak на пропущенном дне', () => {
    const reviews = [
      review(NOW, true),
      review(NOW - 2 * DAY_MS, true),
    ];
    expect(computeStreak(reviews, NOW)).toBe(1);
  });

  it('возвращает 0, если сегодня ответов не было', () => {
    const reviews = [review(NOW - 1 * DAY_MS, true)];
    expect(computeStreak(reviews, NOW)).toBe(0);
  });
});

describe('countMastered', () => {
  function word(interval: number): Word {
    return {
      term: 'x',
      translation: 'y',
      createdAt: 0,
      easinessFactor: 2.5,
      interval,
      repetitions: 0,
      dueDate: 0,
    };
  }

  it('считает слова с interval >= порога (по умолчанию 21 день)', () => {
    const words = [word(1), word(21), word(30)];
    expect(countMastered(words)).toBe(2);
  });
});

describe('last30DaysActivity', () => {
  it('возвращает массив из 30 булевых значений, последний элемент — сегодня', () => {
    const reviews = [review(NOW, true)];
    const activity = last30DaysActivity(reviews, NOW);
    expect(activity).toHaveLength(30);
    expect(activity[29]).toBe(true);
    expect(activity[0]).toBe(false);
  });
});
