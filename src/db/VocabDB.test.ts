import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { VocabDB } from './VocabDB';
import { DEFAULT_DIFFICULTY, INITIAL_STABILITY_DAYS } from '@/lib/memoryParams';

const TEST_DB_NAME = 'vocab-db-migration-test';

describe('VocabDB migration v1 -> v2', () => {
  afterEach(async () => {
    await Dexie.delete(TEST_DB_NAME);
  });

  it('routes a previously studied word to the review stage without stale decay', async () => {
    const legacy = new Dexie(TEST_DB_NAME);
    legacy.version(1).stores({ words: '++id, term, dueDate', reviews: '++id, wordId, reviewedAt' });
    await legacy.open();
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    await legacy.table('words').add({
      term: 'strong',
      translation: 'сильный',
      createdAt: ninetyDaysAgo,
      easinessFactor: 2.6,
      interval: 30,
      repetitions: 5,
      dueDate: ninetyDaysAgo,
      lastReviewedAt: ninetyDaysAgo,
    });
    legacy.close();

    const upgraded = new VocabDB(TEST_DB_NAME);
    const [word] = await upgraded.words.toArray();

    expect(word.stage).toBe('review');
    expect(word.learningPhase).toBe('B');
    expect(word.reviewStreak).toBe(0);
    expect(word).not.toHaveProperty('rating');
    expect(word.difficulty).toBe(DEFAULT_DIFFICULTY);
    expect(word.stability).toBeGreaterThan(INITIAL_STABILITY_DAYS);
    expect(word.lastReviewedAt).toBeDefined();
    expect(word).not.toHaveProperty('easinessFactor');
    expect(word).not.toHaveProperty('interval');
    expect(word).not.toHaveProperty('repetitions');
    expect(word).not.toHaveProperty('dueDate');
    upgraded.close();
  });

  it('routes a never-studied word to the new stage instead of review', async () => {
    const legacy = new Dexie(TEST_DB_NAME);
    legacy.version(1).stores({ words: '++id, term, dueDate', reviews: '++id, wordId, reviewedAt' });
    await legacy.open();
    const now = Date.now();
    await legacy.table('words').add({
      term: 'fresh',
      translation: 'свежий',
      createdAt: now,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: now,
    });
    legacy.close();

    const upgraded = new VocabDB(TEST_DB_NAME);
    const [word] = await upgraded.words.toArray();

    expect(word.stage).toBe('new');
    expect(word.learningPhase).toBe('A');
    expect(word.reviewStreak).toBe(0);
    expect(word).not.toHaveProperty('rating');
    expect(word.stability).toBe(INITIAL_STABILITY_DAYS);
    expect(word.difficulty).toBe(DEFAULT_DIFFICULTY);
    expect(word.lastReviewedAt).toBeUndefined();
    upgraded.close();
  });
});

describe('VocabDB migration v2 -> v3', () => {
  afterEach(async () => {
    await Dexie.delete(TEST_DB_NAME);
  });

  it('discards an unusable row instead of bricking the database or keeping a term-less word', async () => {
    const legacy = new Dexie(TEST_DB_NAME);
    legacy.version(2).stores({ words: '++id, term, stage' });
    await legacy.open();
    await legacy.table('words').bulkAdd([
      { translation: 'без слова', createdAt: 0, stage: 'new', learningPhase: 'A', phaseStreak: 0, rating: 0, reviewStreak: 0 },
      { term: 'apple', translation: 'яблоко', createdAt: 0, stage: 'new', learningPhase: 'A', phaseStreak: 0, rating: 0, reviewStreak: 0 },
    ]);
    legacy.close();

    const upgraded = new VocabDB(TEST_DB_NAME);
    const words = await upgraded.words.toArray();

    expect(words).toHaveLength(1);
    expect(words[0].term).toBe('apple');
    expect(words[0].kind).toBe('word');
    expect(words.every((w) => typeof w.term === 'string')).toBe(true);
    upgraded.close();
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
