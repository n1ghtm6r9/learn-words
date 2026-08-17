import Dexie, { type Table } from 'dexie';

export interface Word {
  id?: number;
  term: string;
  translation: string;
  category?: string;
  createdAt: number;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  dueDate: number;
  lastReviewedAt?: number;
}

export interface ReviewLog {
  id?: number;
  wordId: number;
  reviewedAt: number;
  correct: boolean;
}

export class VocabDB extends Dexie {
  words!: Table<Word, number>;
  reviews!: Table<ReviewLog, number>;

  constructor() {
    super('vocab-db');
    this.version(1).stores({
      words: '++id, term, category, dueDate',
      reviews: '++id, wordId, reviewedAt',
    });
  }
}

export const db = new VocabDB();

export function createWord(term: string, translation: string, category?: string): Word {
  const now = Date.now();
  return {
    term,
    translation,
    category,
    createdAt: now,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: now,
  };
}
