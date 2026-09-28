import type { Table } from 'dexie';
import type { StudyLanguage } from '@/languages/studyLanguage.type';
import type { Folder } from './folder.type';
import type { LearnWordsDB } from './LearnWordsDB';
import type { Tag } from './tag.type';
import type { Word } from './word.type';
import type { WordTag } from './wordTag.type';
import { languageTableNames } from './languageTableNames';

export class VocabDB {
  readonly store: LearnWordsDB;
  readonly language: StudyLanguage;
  readonly words: Table<Word, string>;
  readonly folders: Table<Folder, string>;
  readonly tags: Table<Tag, string>;
  readonly wordTags: Table<WordTag, string>;
  readonly transaction: LearnWordsDB['transaction'];

  constructor(store: LearnWordsDB, language: StudyLanguage) {
    const names = languageTableNames(language);
    this.store = store;
    this.language = language;
    this.words = store.table(names.words);
    this.folders = store.table(names.folders);
    this.tags = store.table(names.tags);
    this.wordTags = store.table(names.wordTags);
    this.transaction = store.transaction.bind(store) as LearnWordsDB['transaction'];
  }
}
