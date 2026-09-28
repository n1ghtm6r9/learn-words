import { beforeEach, describe, expect, it } from 'vitest';
import { createFolder } from '@/db/createFolder';
import { createTag } from '@/db/createTag';
import { createWord } from '@/db/createWord';
import { getDb } from '@/db/getDb';
import { useUIStore } from '@/store/useUIStore';
import { applyImportPayload } from './applyImportPayload';
import { buildExportPayload } from './buildExportPayload';
import { parseImportPayload } from './parseImportPayload';

const db = getDb('en');

async function clearVocabulary() {
  await Promise.all([db.words.clear(), db.folders.clear(), db.tags.clear(), db.wordTags.clear()]);
}

async function exportFile(): Promise<string> {
  const { theme, accentColor, language, studyLanguage, phaseARepeats, phaseBRepeats, reviewLimit } =
    useUIStore.getState();
  return JSON.stringify(
    buildExportPayload({
      words: await db.words.toArray(),
      folders: await db.folders.toArray(),
      tags: await db.tags.toArray(),
      links: await db.wordTags.toArray(),
      settings: { theme, accentColor, language, studyLanguage, phaseARepeats, phaseBRepeats, reviewLimit },
    }),
  );
}

async function snapshot() {
  const folders = await db.folders.orderBy('order').toArray();
  const tags = await db.tags.orderBy('order').toArray();
  const folderName = new Map(folders.map((folder) => [folder.id, folder.name]));
  const tagName = new Map(tags.map((tag) => [tag.id, tag.name]));
  const links = await db.wordTags.toArray();
  const words = (await db.words.toArray())
    .map((word) => ({
      term: word.term,
      stage: word.stage,
      stability: word.stability,
      folder: word.folderId ? folderName.get(word.folderId) : undefined,
      tags: links
        .filter((link) => link.wordId === word.id)
        .map((link) => tagName.get(link.tagId))
        .sort(),
    }))
    .sort((a, b) => a.term.localeCompare(b.term));
  return {
    folders: folders.map(({ name, color, order }) => ({ name, color, order })),
    tags: tags.map(({ name, color, order }) => ({ name, color, order })),
    words,
  };
}

describe('export and import round trip', () => {
  beforeEach(async () => {
    await clearVocabulary();
    window.localStorage.clear();
    useUIStore.setState({
      theme: 'dark',
      accentColor: 'green',
      language: 'en',
      studyLanguage: 'en',
      phaseARepeats: 4,
      phaseBRepeats: 5,
      reviewLimit: 25,
    });
  });

  it('brings back words with their progress, folders, tags and settings', async () => {
    const travel = await db.folders.add(createFolder('Travel', 'blue', 1));
    await db.folders.add(createFolder('Empty', 'pink', 2));
    const verbs = await db.tags.add(createTag('verbs', 'green', 1));
    const often = await db.tags.add(createTag('often', 'amber', 2));
    const go = await db.words.add({ ...createWord('go', 'идти'), folderId: travel, stage: 'review', stability: 12 });
    await db.words.add(createWord('cat', 'кот'));
    await db.wordTags.bulkAdd([
      { wordId: go, tagId: verbs },
      { wordId: go, tagId: often },
    ]);
    const before = await snapshot();
    const file = await exportFile();

    await clearVocabulary();
    useUIStore.setState({ theme: 'light', accentColor: 'blue', phaseARepeats: 3, phaseBRepeats: 3, reviewLimit: 40 });
    await applyImportPayload(parseImportPayload(file), {
      importWords: true,
      importSettings: true,
      replaceExisting: false,
    });

    expect(await snapshot()).toEqual(before);
    expect(useUIStore.getState()).toMatchObject({
      theme: 'dark',
      accentColor: 'green',
      phaseARepeats: 4,
      phaseBRepeats: 5,
      reviewLimit: 25,
    });
  });

  it('reuses folders and tags that already exist under the same name', async () => {
    const travel = await db.folders.add(createFolder('Travel', 'blue', 1));
    const verbs = await db.tags.add(createTag('verbs', 'green', 1));
    const go = await db.words.add({ ...createWord('go', 'идти'), folderId: travel });
    await db.wordTags.add({ wordId: go, tagId: verbs });
    const file = await exportFile();
    await db.words.clear();
    await db.wordTags.clear();

    await applyImportPayload(parseImportPayload(file), {
      importWords: true,
      importSettings: false,
      replaceExisting: false,
    });

    expect(await db.folders.count()).toBe(1);
    expect(await db.tags.count()).toBe(1);
    const [word] = await db.words.toArray();
    expect(word.folderId).toBe(travel);
    expect(await db.wordTags.toArray()).toEqual([expect.objectContaining({ wordId: word.id, tagId: verbs })]);
  });

  it('keeps the folder of an existing word when replacing it from a file without folders', async () => {
    const travel = await db.folders.add(createFolder('Travel', 'blue', 1));
    await db.words.add({ ...createWord('go', 'идти'), folderId: travel });

    await applyImportPayload(
      parseImportPayload('{"version":3,"words":[{"term":"go","translation":"идти","stage":"review","stability":9}]}'),
      { importWords: true, importSettings: false, replaceExisting: true },
    );

    const [word] = await db.words.toArray();
    expect(word.stability).toBe(9);
    expect(word.folderId).toBe(travel);
  });

  it('does not tag a word twice when the tag is already on it', async () => {
    const verbs = await db.tags.add(createTag('verbs', 'green', 1));
    const go = await db.words.add(createWord('go', 'идти'));
    await db.wordTags.add({ wordId: go, tagId: verbs });

    await applyImportPayload(
      parseImportPayload('{"version":4,"words":[{"term":"go","translation":"идти","tags":["Verbs"]}]}'),
      { importWords: true, importSettings: false, replaceExisting: true },
    );

    expect(await db.wordTags.count()).toBe(1);
  });
});
