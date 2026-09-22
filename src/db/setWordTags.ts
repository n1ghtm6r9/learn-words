import type { VocabDB } from './VocabDB';

export async function setWordTags(db: VocabDB, wordId: number, tagIds: number[]): Promise<void> {
  const wanted = new Set(tagIds);

  await db.transaction('rw', db.wordTags, async () => {
    const existing = await db.wordTags.where('wordId').equals(wordId).toArray();
    const current = new Set(existing.map((link) => link.tagId));

    const obsolete = existing.filter((link) => !wanted.has(link.tagId)).map((link) => link.id!);
    const missing = [...wanted].filter((tagId) => !current.has(tagId)).map((tagId) => ({ wordId, tagId }));

    if (obsolete.length > 0) {
      await db.wordTags.bulkDelete(obsolete);
    }
    if (missing.length > 0) {
      await db.wordTags.bulkAdd(missing);
    }
  });
}
