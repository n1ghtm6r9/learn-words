import type { VocabDB } from '../VocabDB';
import { isEmptyMergePlan } from './isEmptyMergePlan';
import { planDuplicateMerge } from './planDuplicateMerge';

export async function mergeDuplicates(db: VocabDB): Promise<boolean> {
  return db.transaction('rw', db.words, db.folders, db.tags, db.wordTags, async () => {
    const [words, folders, tags, wordTags] = await Promise.all([
      db.words.toArray(),
      db.folders.toArray(),
      db.tags.toArray(),
      db.wordTags.toArray(),
    ]);
    const plan = planDuplicateMerge({ words, folders, tags, wordTags }, db.language);
    if (isEmptyMergePlan(plan)) return false;

    await db.words.bulkUpdate(plan.movedWords);
    await db.wordTags.bulkPut(plan.relinked);
    await db.wordTags.bulkDelete(plan.deletedLinkIds);
    await db.words.bulkDelete(plan.deletedWordIds);
    await db.folders.bulkDelete(plan.deletedFolderIds);
    await db.tags.bulkDelete(plan.deletedTagIds);
    return true;
  });
}
