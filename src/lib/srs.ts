import type { Word } from '../db/word.type';
import type { MatchVerdict } from './fuzzyMatch';

export const DAY_MS = 24 * 60 * 60 * 1000;

export interface SrsState {
  easinessFactor: number;
  interval: number;
  repetitions: number;
}

export function nextSrsState(state: SrsState, quality: number): SrsState {
  let { easinessFactor, interval, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
  }

  easinessFactor =
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  return { easinessFactor, interval, repetitions };
}

export function qualityFromVerdict(verdict: MatchVerdict): number {
  if (verdict === 'correct') return 5;
  if (verdict === 'almost') return 4;
  return 2;
}

export function selectDueWords(words: Word[], now: number, limit = 20): Word[] {
  return words
    .filter((word) => word.dueDate <= now)
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, limit);
}
