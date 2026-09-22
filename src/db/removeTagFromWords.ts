import type { VocabDB } from './VocabDB';

export async function removeTagFromWords(db: VocabDB, wordIds: number[], tagId: number): Promise<number> {
  if (wordIds.length === 0) return 0;

  return db.transaction('rw', db.wordTags, async () => {
    const targets = new Set(wordIds);
    const doomed = (await db.wordTags.where('tagId').equals(tagId).toArray())
      .filter((link) => targets.has(link.wordId))
      .map((link) => link.id!);

    if (doomed.length > 0) {
      await db.wordTags.bulkDelete(doomed);
    }
    return doomed.length;
  });
}
