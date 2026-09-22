import type { VocabDB } from './VocabDB';

export async function addTagToWords(db: VocabDB, wordIds: number[], tagId: number): Promise<number> {
  if (wordIds.length === 0) return 0;

  return db.transaction('rw', db.wordTags, async () => {
    const existing = await db.wordTags.where('tagId').equals(tagId).toArray();
    const tagged = new Set(existing.map((link) => link.wordId));
    const missing = wordIds.filter((wordId) => !tagged.has(wordId)).map((wordId) => ({ wordId, tagId }));

    if (missing.length > 0) {
      await db.wordTags.bulkAdd(missing);
    }
    return missing.length;
  });
}
