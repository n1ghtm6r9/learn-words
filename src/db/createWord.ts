import type { Word } from './word.type';

export function createWord(term: string, translation: string): Word {
  return {
    term,
    translation,
    createdAt: Date.now(),
    stage: 'new',
    learningPhase: 'A',
    phaseStreak: 0,
    rating: 0,
    reviewStreak: 0,
  };
}
