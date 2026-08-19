import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { VocabDB } from './VocabDB';

const TEST_DB_NAME = 'vocab-db-migration-test';

describe('VocabDB migration v2 -> v3', () => {
  afterEach(async () => {
    await Dexie.delete(TEST_DB_NAME);
  });

  it('backfills kind on existing words based on their term', async () => {
    const legacy = new Dexie(TEST_DB_NAME);
    legacy.version(2).stores({ words: '++id, term, stage' });
    await legacy.open();
    await legacy.table('words').bulkAdd([
      { term: 'apple', translation: 'яблоко', createdAt: 0, stage: 'new', learningPhase: 'A', phaseStreak: 0, rating: 0, reviewStreak: 0 },
      { term: 'give up', translation: 'сдаваться', createdAt: 0, stage: 'new', learningPhase: 'A', phaseStreak: 0, rating: 0, reviewStreak: 0 },
      { term: 'as soon as possible', translation: 'как можно скорее', createdAt: 0, stage: 'review', learningPhase: 'B', phaseStreak: 0, rating: 70, reviewStreak: 0 },
    ]);
    legacy.close();

    const upgraded = new VocabDB(TEST_DB_NAME);
    const words = await upgraded.words.toArray();

    expect(words.find((w) => w.term === 'apple')?.kind).toBe('word');
    expect(words.find((w) => w.term === 'give up')?.kind).toBe('word');
    expect(words.find((w) => w.term === 'as soon as possible')?.kind).toBe('phrase');
    upgraded.close();
  });

  it('does not disturb any other field during the kind backfill', async () => {
    const legacy = new Dexie(TEST_DB_NAME);
    legacy.version(2).stores({ words: '++id, term, stage' });
    await legacy.open();
    await legacy.table('words').add({
      term: 'strong',
      translation: 'сильный',
      createdAt: 123,
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 2,
      rating: 85,
      reviewStreak: 4,
      lastReviewedAt: 456,
    });
    legacy.close();

    const upgraded = new VocabDB(TEST_DB_NAME);
    const [word] = await upgraded.words.toArray();

    expect(word).toMatchObject({
      term: 'strong',
      translation: 'сильный',
      createdAt: 123,
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 2,
      rating: 85,
      reviewStreak: 4,
      lastReviewedAt: 456,
      kind: 'word',
    });
    upgraded.close();
  });

  it('the kind index is queryable after migration', async () => {
    const legacy = new Dexie(TEST_DB_NAME);
    legacy.version(2).stores({ words: '++id, term, stage' });
    await legacy.open();
    await legacy.table('words').bulkAdd([
      { term: 'apple', translation: 'яблоко', createdAt: 0, stage: 'new', learningPhase: 'A', phaseStreak: 0, rating: 0, reviewStreak: 0 },
      { term: 'give up', translation: 'сдаваться', createdAt: 0, stage: 'new', learningPhase: 'A', phaseStreak: 0, rating: 0, reviewStreak: 0 },
      { term: 'good morning', translation: 'доброе утро', createdAt: 0, stage: 'new', learningPhase: 'A', phaseStreak: 0, rating: 0, reviewStreak: 0 },
    ]);
    legacy.close();

    const upgraded = new VocabDB(TEST_DB_NAME);
    const phrases = await upgraded.words.where('kind').equals('phrase').toArray();

    expect(phrases).toHaveLength(1);
    expect(phrases[0].term).toBe('good morning');
    upgraded.close();
  });
});
