import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { isUsableWord } from '../isUsableWord';
import type { Word } from '../word.type';
import type { WordTag } from '../wordTag.type';
import { compareIds } from './compareIds';
import { compareLabels } from './compareLabels';
import { compareWordProgress } from './compareWordProgress';
import { duplicateRemap } from './duplicateRemap';
import { labelIdentityKey } from './labelIdentityKey';
import type { MergePlan } from './mergePlan.type';
import type { MergeSnapshot } from './mergeSnapshot.type';
import { wordIdentityKey } from './wordIdentityKey';

function planFolders(words: Word[], wordRemap: Map<string, string>, folderRemap: Map<string, string>) {
  const resolve = (folderId: string | undefined) => (folderId == null ? undefined : (folderRemap.get(folderId) ?? folderId));
  const target = new Map<string, string | undefined>();

  for (const word of words) {
    if (!wordRemap.has(word.id!)) target.set(word.id!, resolve(word.folderId));
  }
  for (const word of words) {
    const keeperId = wordRemap.get(word.id!);
    if (keeperId != null && target.get(keeperId) == null) target.set(keeperId, resolve(word.folderId));
  }

  return words.flatMap((word) => {
    const folderId = target.get(word.id!);
    return folderId != null && folderId !== word.folderId ? [{ key: word.id!, changes: { folderId } }] : [];
  });
}

function planLinks(links: WordTag[], wordRemap: Map<string, string>, tagRemap: Map<string, string>) {
  const rewritten = links.map((link) => {
    const wordId = wordRemap.get(link.wordId) ?? link.wordId;
    const tagId = tagRemap.get(link.tagId) ?? link.tagId;
    return { link, next: { ...link, wordId, tagId }, changed: wordId !== link.wordId || tagId !== link.tagId };
  });
  rewritten.sort((a, b) => Number(a.changed) - Number(b.changed) || compareIds(a.link, b.link));

  const seen = new Set<string>();
  const relinked: WordTag[] = [];
  const deletedLinkIds: string[] = [];
  for (const { link, next, changed } of rewritten) {
    const pair = `${next.wordId}|${next.tagId}`;
    if (seen.has(pair)) {
      deletedLinkIds.push(link.id!);
    } else {
      seen.add(pair);
      if (changed) relinked.push(next);
    }
  }
  return { relinked, deletedLinkIds };
}

export function planDuplicateMerge(snapshot: MergeSnapshot, language: StudyLanguage): MergePlan {
  const words = [...snapshot.words.filter(isUsableWord)].sort(compareWordProgress);
  const folderRemap = duplicateRemap(snapshot.folders, (folder) => labelIdentityKey(folder.name), compareLabels);
  const tagRemap = duplicateRemap(snapshot.tags, (tag) => labelIdentityKey(tag.name), compareLabels);
  const wordRemap = duplicateRemap(words, (word) => wordIdentityKey(word, language), compareWordProgress);

  return {
    deletedWordIds: [...wordRemap.keys()],
    deletedFolderIds: [...folderRemap.keys()],
    deletedTagIds: [...tagRemap.keys()],
    ...planLinks(snapshot.wordTags, wordRemap, tagRemap),
    movedWords: planFolders(words, wordRemap, folderRemap),
  };
}
