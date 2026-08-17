import Dexie, { type Table } from 'dexie';
import type { Word } from './word.type';
import type { ReviewLog } from './reviewLog.type';

export class VocabDB extends Dexie {
  words!: Table<Word, number>;
  reviews!: Table<ReviewLog, number>;

  constructor() {
    super('vocab-db');
    this.version(1).stores({
      words: '++id, term, dueDate',
      reviews: '++id, wordId, reviewedAt',
    });
  }
}
