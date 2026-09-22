import type { VocabDB } from './VocabDB';

export async function deleteTag(db: VocabDB, tagId: number): Promise<void> {
  await db.transaction('rw', db.tags, db.wordTags, async () => {
    await db.wordTags.where('tagId').equals(tagId).delete();
    await db.tags.delete(tagId);
  });
}
