import Dexie, { type Table } from 'dexie';
import { detectWordKind } from '@/lib/detectWordKind';
import { ACCENT_PALETTE } from '@/lib/accentPalette';
import { DEFAULT_DIFFICULTY, INITIAL_STABILITY_DAYS } from '@/lib/memoryParams';
import { seedStabilityFromLegacyRating } from '@/lib/seedStabilityFromLegacyRating';
import type { AccentColor } from '@/store/accentColor.type';
import type { Folder } from './folder.type';
import type { Tag } from './tag.type';
import type { Word } from './word.type';
import type { WordTag } from './wordTag.type';

interface LegacyWordV1 {
  rating?: number;
  interval?: number;
  easinessFactor?: number;
  repetitions?: number;
  dueDate?: number;
}

interface LegacyWordV3 {
  rating?: number;
}

export class VocabDB extends Dexie {
  words!: Table<Word, number>;
  folders!: Table<Folder, number>;
  tags!: Table<Tag, number>;
  wordTags!: Table<WordTag, number>;

  isBlocked = false;

  constructor(name = 'vocab-db') {
    super(name);

    this.on('blocked', () => {
      this.isBlocked = true;
    });

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
            const wasStudied = (word.repetitions ?? 0) > 0 || legacyInterval > 0;
            word.stage = wasStudied ? 'review' : 'new';
            word.learningPhase = wasStudied ? 'B' : 'A';
            word.phaseStreak = 0;
            word.rating = wasStudied ? (legacyInterval >= 21 ? 80 : legacyInterval >= 6 ? 60 : 40) : 0;
            word.reviewStreak = 0;
            delete word.lastReviewedAt;
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
          .modify((word, ref: { value?: Word }) => {
            if (typeof word.term !== 'string' || typeof word.translation !== 'string') {
              delete ref.value;
              return;
            }
            word.kind = detectWordKind(word.term);
          });
      });

    this.version(4)
      .stores({
        words: '++id, term, stage, kind',
      })
      .upgrade(async (tx) => {
        await tx
          .table<Word & LegacyWordV3, number>('words')
          .toCollection()
          .modify((word, ref: { value?: Word }) => {
            if (typeof word.term !== 'string' || typeof word.translation !== 'string') {
              delete ref.value;
              return;
            }
            const legacyRating = word.rating ?? 0;
            const streak = word.reviewStreak ?? 0;

            word.difficulty = DEFAULT_DIFFICULTY;
            if (word.stage === 'review') {
              word.lastReviewedAt ??= Date.now();
              word.stability = seedStabilityFromLegacyRating(legacyRating, streak, word.term);
            } else {
              word.stability = INITIAL_STABILITY_DAYS;
            }

            delete word.rating;
          });
      });

    this.version(5).stores({
      words: '++id, term, stage, kind, folderId',
      folders: '++id, name, order',
      tags: '++id, name, order',
      wordTags: '++id, wordId, tagId, &[wordId+tagId]',
    });

    this.version(6)
      .stores({
        folders: '++id, name, order',
      })
      .upgrade(async (tx) => {
        const palette = Object.keys(ACCENT_PALETTE) as AccentColor[];
        let index = 0;
        await tx
          .table<Folder, number>('folders')
          .toCollection()
          .modify((folder) => {
            folder.color ??= palette[index++ % palette.length];
          });
      });
  }
}
