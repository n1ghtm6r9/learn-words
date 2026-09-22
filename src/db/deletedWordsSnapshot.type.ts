import type { Word } from './word.type';
import type { WordTag } from './wordTag.type';

export interface DeletedWordsSnapshot {
  words: Word[];
  links: WordTag[];
}
