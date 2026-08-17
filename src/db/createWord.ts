import type { Word } from './word.type';

export function createWord(term: string, translation: string): Word {
  const now = Date.now();
  return {
    term,
    translation,
    createdAt: now,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: now,
  };
}
