import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VocabDB } from './VocabDB';
import { createWord } from './createWord';
import { createFolder } from './createFolder';
import { createTag } from './createTag';
import { deleteFolder } from './deleteFolder';
import { deleteTag } from './deleteTag';
import { deleteWordCascade } from './deleteWordCascade';
import { setWordTags } from './setWordTags';
import { addTagToWords } from './addTagToWords';
import { removeTagFromWords } from './removeTagFromWords';
import { moveWordsToFolder } from './moveWordsToFolder';
import { swapOrder } from './swapOrder';
import { writeOrder } from './writeOrder';
import { deleteWordsCascade } from './deleteWordsCascade';
import { restoreWords } from './restoreWords';
import { restoreWordFolders } from './restoreWordFolders';
import { reorderByDrag } from '@/lib/reorderByDrag';

const TEST_DB_NAME = 'vocab-db-cascade-test';

describe('folder and tag cascades', () => {
  let db: VocabDB;

  beforeEach(async () => {
    db = new VocabDB(TEST_DB_NAME);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(TEST_DB_NAME);
  });

  it('drops the tag links of a deleted word', async () => {
    const wordId = await db.words.add(createWord('house', 'дом'));
    const otherId = await db.words.add(createWord('tree', 'дерево'));
    const tagId = await db.tags.add(createTag('nouns', 'blue', 1));
    await db.wordTags.bulkAdd([
      { wordId, tagId },
      { wordId: otherId, tagId },
    ]);

    await deleteWordCascade(db, wordId);

    expect(await db.words.get(wordId)).toBeUndefined();
    expect(await db.wordTags.where('wordId').equals(wordId).count()).toBe(0);
    expect(await db.wordTags.where('wordId').equals(otherId).count()).toBe(1);
  });

  it('keeps the words of a deleted folder and clears their folder', async () => {
    const folderId = await db.folders.add(createFolder('work', 'blue', 1));
    const wordId = await db.words.add({ ...createWord('meeting', 'встреча'), folderId });

    await deleteFolder(db, folderId);

    expect(await db.folders.get(folderId)).toBeUndefined();
    const word = await db.words.get(wordId);
    expect(word).toBeDefined();
    expect(word?.folderId).toBeUndefined();
  });

  it('keeps the words of a deleted tag and drops only its links', async () => {
    const wordId = await db.words.add(createWord('hard', 'трудный'));
    const keptTagId = await db.tags.add(createTag('kept', 'green', 1));
    const doomedTagId = await db.tags.add(createTag('doomed', 'orange', 2));
    await db.wordTags.bulkAdd([
      { wordId, tagId: keptTagId },
      { wordId, tagId: doomedTagId },
    ]);

    await deleteTag(db, doomedTagId);

    expect(await db.words.get(wordId)).toBeDefined();
    const links = await db.wordTags.where('wordId').equals(wordId).toArray();
    expect(links.map((link) => link.tagId)).toEqual([keptTagId]);
  });

  it('refuses to link the same tag to the same word twice', async () => {
    const wordId = await db.words.add(createWord('twice', 'дважды'));
    const tagId = await db.tags.add(createTag('unique', 'purple', 1));

    await db.wordTags.add({ wordId, tagId });
    await expect(db.wordTags.add({ wordId, tagId })).rejects.toThrow();

    expect(await db.wordTags.where('wordId').equals(wordId).count()).toBe(1);
  });
});

describe('setWordTags', () => {
  let db: VocabDB;

  beforeEach(async () => {
    db = new VocabDB(TEST_DB_NAME);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(TEST_DB_NAME);
  });

  it('adds the missing links and removes the obsolete ones', async () => {
    const wordId = await db.words.add(createWord('change', 'менять'));
    const keptId = await db.tags.add(createTag('kept', 'blue', 1));
    const droppedId = await db.tags.add(createTag('dropped', 'green', 2));
    const addedId = await db.tags.add(createTag('added', 'orange', 3));
    await db.wordTags.bulkAdd([
      { wordId, tagId: keptId },
      { wordId, tagId: droppedId },
    ]);

    await setWordTags(db, wordId, [keptId, addedId]);

    const links = await db.wordTags.where('wordId').equals(wordId).toArray();
    expect(links.map((link) => link.tagId).sort()).toEqual([keptId, addedId].sort());
  });

  it('clears every link when the wanted set is empty', async () => {
    const wordId = await db.words.add(createWord('clear', 'очистить'));
    const tagId = await db.tags.add(createTag('gone', 'blue', 1));
    await db.wordTags.add({ wordId, tagId });

    await setWordTags(db, wordId, []);

    expect(await db.wordTags.where('wordId').equals(wordId).count()).toBe(0);
  });

  it('runs inside an ongoing transaction without breaking it', async () => {
    const wordId = await db.words.add(createWord('nested', 'вложенный'));
    const tagId = await db.tags.add(createTag('nested', 'purple', 1));

    await db.transaction('rw', db.words, db.wordTags, async () => {
      await db.words.update(wordId, { translation: 'вложенный заново' });
      await setWordTags(db, wordId, [tagId]);
    });

    expect((await db.words.get(wordId))?.translation).toBe('вложенный заново');
    expect(await db.wordTags.where('wordId').equals(wordId).count()).toBe(1);
  });
});

describe('bulk operations', () => {
  let db: VocabDB;

  beforeEach(async () => {
    db = new VocabDB(TEST_DB_NAME);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(TEST_DB_NAME);
  });

  it('moves a selection of words into a folder', async () => {
    const folderId = await db.folders.add(createFolder('travel', 'blue', 1));
    const first = await db.words.add(createWord('airport', 'аэропорт'));
    const second = await db.words.add(createWord('ticket', 'билет'));
    const untouched = await db.words.add(createWord('table', 'стол'));

    const moved = await moveWordsToFolder(db, [first, second], folderId);

    expect(moved).toBe(2);
    expect((await db.words.get(first))?.folderId).toBe(folderId);
    expect((await db.words.get(second))?.folderId).toBe(folderId);
    expect((await db.words.get(untouched))?.folderId).toBeUndefined();
  });

  it('moves a selection back out of any folder', async () => {
    const folderId = await db.folders.add(createFolder('temporary', 'blue', 1));
    const wordId = await db.words.add({ ...createWord('loose', 'свободный'), folderId });

    await moveWordsToFolder(db, [wordId], null);

    expect((await db.words.get(wordId))?.folderId).toBeUndefined();
  });

  it('tags a selection without duplicating existing links', async () => {
    const tagId = await db.tags.add(createTag('verbs', 'green', 1));
    const alreadyTagged = await db.words.add(createWord('run', 'бежать'));
    const untagged = await db.words.add(createWord('walk', 'идти'));
    await db.wordTags.add({ wordId: alreadyTagged, tagId });

    const added = await addTagToWords(db, [alreadyTagged, untagged], tagId);

    expect(added).toBe(1);
    expect(await db.wordTags.where('tagId').equals(tagId).count()).toBe(2);
  });

  it('removes a tag only from the selected words', async () => {
    const tagId = await db.tags.add(createTag('shared', 'orange', 1));
    const selected = await db.words.add(createWord('one', 'один'));
    const other = await db.words.add(createWord('two', 'два'));
    await db.wordTags.bulkAdd([
      { wordId: selected, tagId },
      { wordId: other, tagId },
    ]);

    const removed = await removeTagFromWords(db, [selected], tagId);

    expect(removed).toBe(1);
    const left = await db.wordTags.where('tagId').equals(tagId).toArray();
    expect(left.map((link) => link.wordId)).toEqual([other]);
  });
});

describe('swapOrder', () => {
  let db: VocabDB;

  beforeEach(async () => {
    db = new VocabDB(TEST_DB_NAME);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(TEST_DB_NAME);
  });

  it('exchanges the order of two folders', async () => {
    const firstId = await db.folders.add(createFolder('first', 'blue', 1));
    const secondId = await db.folders.add(createFolder('second', 'blue', 2));

    await swapOrder(db.folders, firstId, secondId);

    expect((await db.folders.get(firstId))?.order).toBe(2);
    expect((await db.folders.get(secondId))?.order).toBe(1);
  });

  it('leaves the table untouched when one row is missing', async () => {
    const firstId = await db.folders.add(createFolder('lonely', 'blue', 1));

    await swapOrder(db.folders, firstId, firstId + 999);

    expect((await db.folders.get(firstId))?.order).toBe(1);
  });
});

describe('writeOrder with reorderByDrag', () => {
  let db: VocabDB;

  beforeEach(async () => {
    db = new VocabDB(TEST_DB_NAME);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(TEST_DB_NAME);
  });

  it('persists the order a drag produced', async () => {
    await db.folders.bulkAdd([
      createFolder('first', 'blue', 1),
      createFolder('second', 'green', 2),
      createFolder('third', 'orange', 3),
    ]);

    const before = await db.folders.orderBy('order').toArray();
    const dragged = before[2].id!;
    const target = before[0].id!;

    await writeOrder(db.folders, reorderByDrag(before, dragged, target).map((f) => f.id!));

    const after = await db.folders.orderBy('order').toArray();
    expect(after.map((f) => f.name)).toEqual(['third', 'first', 'second']);
  });

  it('renumbers every row so no two share a position', async () => {
    await db.tags.bulkAdd([createTag('a', 'blue', 5), createTag('b', 'green', 5)]);

    const rows = await db.tags.toArray();
    await writeOrder(db.tags, [rows[1].id!, rows[0].id!]);

    const after = await db.tags.orderBy('order').toArray();
    expect(after.map((t) => t.order)).toEqual([1, 2]);
    expect(after.map((t) => t.name)).toEqual(['b', 'a']);
  });
});

describe('undoable bulk operations', () => {
  let db: VocabDB;

  beforeEach(async () => {
    db = new VocabDB(TEST_DB_NAME);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(TEST_DB_NAME);
  });

  it('deletes a selection with its tag links and restores both on undo', async () => {
    const tagId = await db.tags.add(createTag('verbs', 'blue', 1));
    const first = await db.words.add({ ...createWord('run', 'бежать'), stability: 7 });
    const second = await db.words.add(createWord('walk', 'идти'));
    const kept = await db.words.add(createWord('table', 'стол'));
    await db.wordTags.bulkAdd([
      { wordId: first, tagId },
      { wordId: second, tagId },
      { wordId: kept, tagId },
    ]);

    const snapshot = await deleteWordsCascade(db, [first, second]);

    expect(await db.words.count()).toBe(1);
    expect(await db.wordTags.count()).toBe(1);

    await restoreWords(db, snapshot);

    expect((await db.words.get(first))?.stability).toBe(7);
    expect(await db.words.get(second)).toBeDefined();
    expect(await db.wordTags.where('tagId').equals(tagId).count()).toBe(3);
  });

  it('does not bring back links to a tag deleted in the meantime', async () => {
    const tagId = await db.tags.add(createTag('gone', 'blue', 1));
    const wordId = await db.words.add(createWord('run', 'бежать'));
    await db.wordTags.add({ wordId, tagId });

    const snapshot = await deleteWordsCascade(db, [wordId]);
    await db.tags.delete(tagId);
    await restoreWords(db, snapshot);

    expect(await db.words.get(wordId)).toBeDefined();
    expect(await db.wordTags.count()).toBe(0);
  });

  it('puts moved words back into the folders they came from', async () => {
    const work = await db.folders.add(createFolder('work', 'blue', 1));
    const travel = await db.folders.add(createFolder('travel', 'green', 2));
    const inWork = await db.words.add({ ...createWord('meeting', 'встреча'), folderId: work });
    const loose = await db.words.add(createWord('table', 'стол'));

    await moveWordsToFolder(db, [inWork, loose], travel);
    await restoreWordFolders(db, new Map([[inWork, work], [loose, undefined]]));

    expect((await db.words.get(inWork))?.folderId).toBe(work);
    expect((await db.words.get(loose))?.folderId).toBeUndefined();
  });

  it('leaves a word outside any folder when its old folder no longer exists', async () => {
    const doomed = await db.folders.add(createFolder('doomed', 'blue', 1));
    const travel = await db.folders.add(createFolder('travel', 'green', 2));
    const wordId = await db.words.add({ ...createWord('meeting', 'встреча'), folderId: doomed });

    await moveWordsToFolder(db, [wordId], travel);
    await db.folders.delete(doomed);
    await restoreWordFolders(db, new Map([[wordId, doomed]]));

    expect((await db.words.get(wordId))?.folderId).toBeUndefined();
  });
});
