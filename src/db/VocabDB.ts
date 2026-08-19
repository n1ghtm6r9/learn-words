import Dexie, { type Table } from 'dexie';
import { detectWordKind } from '@/lib/detectWordKind';
import type { Word } from './word.type';

interface LegacyWordV1 {
  interval?: number;
  easinessFactor?: number;
  repetitions?: number;
  dueDate?: number;
}

export class VocabDB extends Dexie {
  words!: Table<Word, number>;

  constructor(name = 'vocab-db') {
    super(name);

    this.version(1).stores({
      words: '++id, term, dueDate',
      reviews: '++id, wordId, reviewedAt',
    });

    this.version(2)
      .stores({
        words: '++id, term, stage',
        reviews: null,
      })
      .upgrade(async (tx) => {
        await tx
          .table<Word & LegacyWordV1, number>('words')
          .toCollection()
          .modify((word) => {
            const legacyInterval = word.interval ?? 0;
            word.stage = 'review';
            word.learningPhase = 'B';
            word.phaseStreak = 0;
            word.rating = legacyInterval >= 21 ? 80 : legacyInterval >= 6 ? 60 : 40;
            word.reviewStreak = 0;
            delete word.easinessFactor;
            delete word.interval;
            delete word.repetitions;
            delete word.dueDate;
          });
      });

    this.version(3)
      .stores({
        words: '++id, term, stage, kind',
      })
      .upgrade(async (tx) => {
        await tx
          .table<Word, number>('words')
          .toCollection()
          .modify((word) => {
            word.kind = detectWordKind(word.term);
          });
      });
  }
}
