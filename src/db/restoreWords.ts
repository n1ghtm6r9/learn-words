import type { DeletedWordsSnapshot } from './deletedWordsSnapshot.type';
import type { VocabDB } from './VocabDB';

export async function restoreWords(db: VocabDB, snapshot: DeletedWordsSnapshot): Promise<void> {
  await db.transaction('rw', db.words, db.tags, db.wordTags, async () => {
    await db.words.bulkPut(snapshot.words);
    const liveTagIds = new Set((await db.tags.toArray()).map((tag) => tag.id));
    await db.wordTags.bulkPut(snapshot.links.filter((link) => liveTagIds.has(link.tagId)));
  });
}
