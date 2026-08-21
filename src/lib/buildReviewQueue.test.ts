import { describe, expect, it } from 'vitest';
import { buildReviewQueue } from './buildReviewQueue';
import { applyReviewOutcome } from './applyReviewOutcome';
import { dueAt } from './dueAt';
import { isDue } from './isDue';
import { INITIAL_STABILITY_DAYS } from './memoryParams';
import { DAY_MS } from './time';
import type { Word } from '@/db/word.type';

const NOW = 1_700_000_000_000;

function word(term: string, overrides: Partial<Word> = {}): Word {
  return {
    term,
    translation: `перевод ${term}`,
    createdAt: 0,
    kind: 'word',
    stage: 'review',
    learningPhase: 'B',
    phaseStreak: 0,
    stability: 10,
    difficulty: 5,
    reviewStreak: 0,
    lastReviewedAt: NOW - 10 * DAY_MS,
    ...overrides,
  };
}

describe('buildReviewQueue', () => {
  it('includes a word whose interval has elapsed', () => {
    const queue = buildReviewQueue([word('due', { stability: 5, lastReviewedAt: NOW - 6 * DAY_MS })], NOW, 50);

    expect(queue.map((w) => w.term)).toEqual(['due']);
  });

  it('leaves a word that is not due out while due words still fill the session', () => {
    const due = Array.from({ length: 3 }, (_, i) =>
      word(`due${i}`, { stability: 5, lastReviewedAt: NOW - (6 + i) * DAY_MS }),
    );
    const notDue = word('early', { stability: 30, lastReviewedAt: NOW - 2 * DAY_MS });

    expect(buildReviewQueue([notDue, ...due], NOW, 3).map((w) => w.term)).not.toContain('early');
  });

  it('fills the rest of the session with waiting words once the due ones run out', () => {
    const queue = buildReviewQueue(
      [
        word('due', { stability: 5, lastReviewedAt: NOW - 6 * DAY_MS }),
        word('waiting-most', { stability: 30, lastReviewedAt: NOW - 25 * DAY_MS }),
        word('waiting-least', { stability: 30, lastReviewedAt: NOW - DAY_MS }),
      ],
      NOW,
      10,
    );

    expect(queue.map((w) => w.term)).toEqual(['due', 'waiting-most', 'waiting-least']);
  });

  it('never offers a word that is not due ahead of one that is', () => {
    const queue = buildReviewQueue(
      [
        word('waiting', { stability: 30, lastReviewedAt: NOW - 29 * DAY_MS }),
        word('due', { stability: 5, lastReviewedAt: NOW - 5 * DAY_MS }),
      ],
      NOW,
      10,
    );

    expect(queue[0].term).toBe('due');
  });

  it('puts the most-forgotten word first', () => {
    const queue = buildReviewQueue(
      [
        word('barely-due', { stability: 10, lastReviewedAt: NOW - 11 * DAY_MS }),
        word('long-overdue', { stability: 2, lastReviewedAt: NOW - 60 * DAY_MS }),
        word('overdue', { stability: 10, lastReviewedAt: NOW - 25 * DAY_MS }),
      ],
      NOW,
      50,
    );

    expect(queue.map((w) => w.term)).toEqual(['long-overdue', 'overdue', 'barely-due']);
  });

  it('caps the session so a huge backlog does not become an unusable wall', () => {
    const backlog = Array.from({ length: 1000 }, (_, i) =>
      word(`word${i}`, { stability: 1, lastReviewedAt: NOW - (10 + i) * DAY_MS }),
    );

    expect(buildReviewQueue(backlog, NOW, 40)).toHaveLength(40);
  });

  it('treats a review word with no review timestamp as due, so it cannot get stranded', () => {
    const orphan = word('orphan', { lastReviewedAt: undefined });
    const filler = word('filler', { stability: 30, lastReviewedAt: NOW - DAY_MS });

    expect(isDue(orphan, NOW)).toBe(true);
    expect(buildReviewQueue([filler, orphan], NOW, 50)[0].term).toBe('orphan');
  });

  it('can still reach a word whose stored interval is corrupt, instead of stranding it forever', () => {
    const corrupt = word('corrupt', { stability: Number.NaN });

    expect(isDue(corrupt, NOW)).toBe(true);
    expect(buildReviewQueue([corrupt], NOW, 50).map((w) => w.term)).toEqual(['corrupt']);
  });

  it('runs an empty session rather than an unbounded one when the limit is unusable', () => {
    const due = [word('a', { stability: 1, lastReviewedAt: NOW - 9 * DAY_MS })];

    expect(buildReviewQueue(due, NOW, Number.NaN)).toEqual([]);
  });

  it('keeps a word answered correctly out of the queue for far longer than a day', () => {
    let current = word('known', { stability: INITIAL_STABILITY_DAYS, lastReviewedAt: NOW });
    let at = NOW;

    for (let i = 0; i < 6; i++) {
      at = dueAt(current)!;
      current = { ...current, ...applyReviewOutcome(current, 'correct', 1, 1, at) };
    }

    const daysUntilNext = (dueAt(current)! - at) / DAY_MS;
    expect(daysUntilNext).toBeGreaterThan(20);

    const busySession = Array.from({ length: 40 }, (_, i) =>
      word(`due${i}`, { stability: 1, lastReviewedAt: at - (5 + i) * DAY_MS }),
    );
    const queue = buildReviewQueue([current, ...busySession], at + 7 * DAY_MS, 40);
    expect(queue.map((w) => w.term)).not.toContain('known');
  });

  it('brings a lapsed word back quickly even though it used to be well known', () => {
    const seasoned = word('slipped', { stability: 120, lastReviewedAt: NOW - 120 * DAY_MS });
    const at = dueAt(seasoned)!;
    const lapsed = { ...seasoned, ...applyReviewOutcome(seasoned, 'wrong', 0.2, 1, at) };

    const daysUntilNext = (dueAt(lapsed)! - at) / DAY_MS;
    expect(daysUntilNext).toBeLessThan(14);
    expect(buildReviewQueue([lapsed], at + 14 * DAY_MS, 40)).toHaveLength(1);
  });
});
