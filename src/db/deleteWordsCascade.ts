import type { DeletedWordsSnapshot } from './deletedWordsSnapshot.type';
import type { VocabDB } from './VocabDB';

export async function deleteWordsCascade(db: VocabDB, wordIds: number[]): Promise<DeletedWordsSnapshot> {
  if (wordIds.length === 0) return { words: [], links: [] };

  return db.transaction('rw', db.words, db.wordTags, async () => {
    const words = (await db.words.bulkGet(wordIds)).filter((word) => word != null);
    const links = await db.wordTags.where('wordId').anyOf(wordIds).toArray();

    await db.wordTags.bulkDelete(links.map((link) => link.id!));
    await db.words.bulkDelete(wordIds);

    return { words, links };
  });
}
