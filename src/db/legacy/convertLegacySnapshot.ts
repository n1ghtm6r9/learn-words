import type { Folder } from '../folder.type';
import { isUsableWord } from '../isUsableWord';
import type { Tag } from '../tag.type';
import type { Word } from '../word.type';
import type { WordTag } from '../wordTag.type';
import type { LegacySnapshot } from './legacySnapshot.type';
import { remapIds } from './remapIds';

export function convertLegacySnapshot(snapshot: LegacySnapshot): {
  words: Word[];
  folders: Folder[];
  tags: Tag[];
  wordTags: WordTag[];
} {
  const words = snapshot.words.filter(isUsableWord);
  const folderIds = remapIds(snapshot.folders);
  const tagIds = remapIds(snapshot.tags);
  const wordIds = remapIds(words);

  const folders = snapshot.folders.flatMap(({ id, ...rest }) =>
    id == null ? [] : [{ ...rest, id: folderIds.get(id)! }],
  );
  const tags = snapshot.tags.flatMap(({ id, ...rest }) => (id == null ? [] : [{ ...rest, id: tagIds.get(id)! }]));

  const convertedWords = words.flatMap(({ id, folderId, ...rest }) => {
    if (id == null) return [];
    const word: Word = { ...rest, id: wordIds.get(id)! };
    const mappedFolder = folderId == null ? undefined : folderIds.get(folderId);
    if (mappedFolder) word.folderId = mappedFolder;
    return [word];
  });

  const seenLinks = new Set<string>();
  const wordTags = snapshot.wordTags.flatMap((link) => {
    const wordId = wordIds.get(link.wordId);
    const tagId = tagIds.get(link.tagId);
    if (!wordId || !tagId) return [];
    const pair = `${wordId}|${tagId}`;
    if (seenLinks.has(pair)) return [];
    seenLinks.add(pair);
    return [{ wordId, tagId }];
  });

  return { words: convertedWords, folders, tags, wordTags };
}
