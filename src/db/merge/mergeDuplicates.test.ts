import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFolder } from '../createFolder';
import { createTag } from '../createTag';
import { createWord } from '../createWord';
import { LearnWordsDB } from '../LearnWordsDB';
import { VocabDB } from '../VocabDB';
import { mergeDuplicates } from './mergeDuplicates';

const STORE_NAME = 'learn-words-merge-test';

describe('mergeDuplicates', () => {
  let store: LearnWordsDB;
  let db: VocabDB;

  beforeEach(async () => {
    store = new LearnWordsDB(STORE_NAME);
    db = new VocabDB(store, 'en');
    await store.open();
  });

  afterEach(async () => {
    store.close();
    await Dexie.delete(STORE_NAME);
  });

  it('keeps the copy with more progress when the same word came from two devices', async () => {
    const fresh = await db.words.add(createWord('go', 'идти'));
    const studied = await db.words.add({
      ...createWord('Go', 'идти'),
      stage: 'review',
      stability: 9,
      lastReviewedAt: Date.now(),
    });

    expect(await mergeDuplicates(db)).toBe(true);

    expect((await db.words.toArray()).map((word) => word.id)).toEqual([studied]);
    expect(await db.words.get(fresh)).toBeUndefined();
  });

  it('leaves homonyms with different translations alone', async () => {
    await db.words.add(createWord('bank', 'банк'));
    await db.words.add(createWord('bank', 'берег'));

    expect(await mergeDuplicates(db)).toBe(false);
    expect(await db.words.count()).toBe(2);
  });

  it('folds same-named folders and tags together and moves their words and links', async () => {
    const keptFolder = await db.folders.add(createFolder('Travel', 'blue', 1));
    const extraFolder = await db.folders.add(createFolder('travel', 'red', 2));
    const keptTag = await db.tags.add(createTag('verbs', 'green', 1));
    const extraTag = await db.tags.add(createTag('Verbs', 'pink', 2));
    const word = await db.words.add({ ...createWord('fly', 'лететь'), folderId: extraFolder });
    await db.wordTags.add({ wordId: word, tagId: extraTag });
    await db.wordTags.add({ wordId: word, tagId: keptTag });

    await mergeDuplicates(db);

    expect((await db.folders.toArray()).map((folder) => folder.id)).toEqual([keptFolder]);
    expect((await db.tags.toArray()).map((tag) => tag.id)).toEqual([keptTag]);
    expect((await db.words.get(word))?.folderId).toBe(keptFolder);
    expect(await db.wordTags.toArray()).toEqual([expect.objectContaining({ wordId: word, tagId: keptTag })]);
  });

  it('carries the folder and tags of a dropped copy over to the kept one', async () => {
    const folder = await db.folders.add(createFolder('Travel', 'blue', 1));
    const tag = await db.tags.add(createTag('verbs', 'green', 1));
    const kept = await db.words.add({ ...createWord('run', 'бежать'), stage: 'review', stability: 5 });
    const dropped = await db.words.add({ ...createWord('run', 'бежать'), folderId: folder });
    await db.wordTags.add({ wordId: dropped, tagId: tag });

    await mergeDuplicates(db);

    expect((await db.words.get(kept))?.folderId).toBe(folder);
    expect(await db.wordTags.toArray()).toEqual([expect.objectContaining({ wordId: kept, tagId: tag })]);
  });

  it('removes repeated links between the same word and tag', async () => {
    const tag = await db.tags.add(createTag('verbs', 'green', 1));
    const word = await db.words.add(createWord('sit', 'сидеть'));
    await db.wordTags.bulkAdd([
      { wordId: word, tagId: tag },
      { wordId: word, tagId: tag },
    ]);

    await mergeDuplicates(db);

    expect(await db.wordTags.count()).toBe(1);
  });

  it('reports nothing to do on a clean vocabulary', async () => {
    await db.words.add(createWord('cat', 'кот'));

    expect(await mergeDuplicates(db)).toBe(false);
  });
});
