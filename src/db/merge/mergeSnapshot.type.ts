import type { Folder } from '../folder.type';
import type { Tag } from '../tag.type';
import type { Word } from '../word.type';
import type { WordTag } from '../wordTag.type';

export interface MergeSnapshot {
  words: Word[];
  folders: Folder[];
  tags: Tag[];
  wordTags: WordTag[];
}
