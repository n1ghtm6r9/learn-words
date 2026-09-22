import type { Word } from '@/db/word.type';
import type { WordScope } from './wordScope.type';

export function filterWordsByScope(
  words: Word[],
  scope: WordScope,
  tagsByWord: Map<number, number[]>,
): Word[] {
  const matchesFolder =
    scope.folderId === 'all'
      ? () => true
      : scope.folderId === null
        ? (word: Word) => word.folderId == null
        : (word: Word) => word.folderId === scope.folderId;

  if (scope.tagIds.length === 0) return words.filter(matchesFolder);

  return words.filter((word) => {
    if (!matchesFolder(word)) return false;
    const owned = word.id == null ? undefined : tagsByWord.get(word.id);
    if (!owned) return false;
    return scope.tagIds.every((tagId) => owned.includes(tagId));
  });
}
