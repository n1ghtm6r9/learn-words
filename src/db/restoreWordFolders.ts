import type { VocabDB } from './VocabDB';

export async function restoreWordFolders(db: VocabDB, previous: Map<number, number | undefined>): Promise<void> {
  if (previous.size === 0) return;

  await db.transaction('rw', db.words, db.folders, async () => {
    const liveFolderIds = new Set((await db.folders.toArray()).map((folder) => folder.id));
    await db.words
      .where('id')
      .anyOf([...previous.keys()])
      .modify((word) => {
        const folderId = previous.get(word.id!);
        if (folderId != null && liveFolderIds.has(folderId)) {
          word.folderId = folderId;
        } else {
          delete word.folderId;
        }
      });
  });
}
