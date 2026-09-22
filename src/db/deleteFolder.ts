import type { VocabDB } from './VocabDB';

export async function deleteFolder(db: VocabDB, folderId: number): Promise<void> {
  await db.transaction('rw', db.words, db.folders, async () => {
    await db.words
      .where('folderId')
      .equals(folderId)
      .modify((word) => {
        delete word.folderId;
      });
    await db.folders.delete(folderId);
  });
}
