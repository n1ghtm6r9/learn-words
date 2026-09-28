import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWord } from '../createWord';
import { LearnWordsDB } from '../LearnWordsDB';
import { VocabDB } from '../VocabDB';
import { LegacyVocabDB } from './LegacyVocabDB';
import type { LegacyWord } from './legacyWord.type';
import { legacyMigrationMarker } from './legacyMigrationMarker';
import { migrateLegacyDatabase } from './migrateLegacyDatabase';

const LEGACY_NAME = 'vocab-db-legacy-migration-test';
const STORE_NAME = 'learn-words-legacy-migration-test';

function legacyWord(term: string, translation: string): LegacyWord {
  const { id: _id, folderId: _folderId, ...rest } = createWord(term, translation);
  return rest;
}

async function seedLegacy(): Promise<void> {
  const legacy = new LegacyVocabDB(LEGACY_NAME);
  await legacy.open();
  const folderId = await legacy.folders.add({ name: 'Travel', color: 'blue', order: 1 });
  const tagId = await legacy.tags.add({ name: 'verbs', color: 'green', order: 1 });
  const wordId = await legacy.words.add({ ...legacyWord('go', 'идти'), folderId, stage: 'review', stability: 12 });
  await legacy.words.add(legacyWord('cat', 'кот'));
  await legacy.wordTags.add({ wordId, tagId });
  legacy.close();
}

describe('migrateLegacyDatabase', () => {
  let store: LearnWordsDB;
  let db: VocabDB;

  beforeEach(async () => {
    window.localStorage.clear();
    store = new LearnWordsDB(STORE_NAME);
    db = new VocabDB(store, 'en');
    await store.open();
  });

  afterEach(async () => {
    store.close();
    await Dexie.delete(STORE_NAME);
    await Dexie.delete(LEGACY_NAME);
  });

  it('copies words, folders, tags and links with fresh string ids', async () => {
    await seedLegacy();

    await migrateLegacyDatabase(db, LEGACY_NAME);

    const [folder] = await db.folders.toArray();
    const [tag] = await db.tags.toArray();
    const go = await db.words.where('term').equals('go').first();
    const links = await db.wordTags.toArray();

    expect(await db.words.count()).toBe(2);
    expect(typeof folder.id).toBe('string');
    expect(folder.name).toBe('Travel');
    expect(go?.folderId).toBe(folder.id);
    expect(go?.stage).toBe('review');
    expect(go?.stability).toBe(12);
    expect(links).toEqual([expect.objectContaining({ wordId: go?.id, tagId: tag.id })]);
  });

  it('keeps the legacy database as a backup', async () => {
    await seedLegacy();

    await migrateLegacyDatabase(db, LEGACY_NAME);

    expect(await Dexie.exists(LEGACY_NAME)).toBe(true);
  });

  it('runs only once per legacy database', async () => {
    await seedLegacy();

    await migrateLegacyDatabase(db, LEGACY_NAME);
    await migrateLegacyDatabase(db, LEGACY_NAME);

    expect(await db.words.count()).toBe(2);
  });

  it('leaves a store that already holds words untouched even without the marker', async () => {
    await seedLegacy();
    await db.words.add(createWord('dog', 'собака'));

    await migrateLegacyDatabase(db, LEGACY_NAME);

    expect((await db.words.toArray()).map((word) => word.term)).toEqual(['dog']);
    expect(window.localStorage.getItem(legacyMigrationMarker(LEGACY_NAME))).not.toBeNull();
  });

  it('marks a missing legacy database as handled without creating it', async () => {
    await migrateLegacyDatabase(db, LEGACY_NAME);

    expect(await db.words.count()).toBe(0);
    expect(await Dexie.exists(LEGACY_NAME)).toBe(false);
    expect(window.localStorage.getItem(legacyMigrationMarker(LEGACY_NAME))).not.toBeNull();
  });
});
