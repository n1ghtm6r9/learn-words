import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { languageTableNames } from './languageTableNames';

export function languageSchema(language: StudyLanguage): Record<string, string> {
  const names = languageTableNames(language);
  return {
    [names.words]: 'id, term, stage, kind, folderId',
    [names.folders]: 'id, name, order',
    [names.tags]: 'id, name, order',
    [names.wordTags]: 'id, wordId, tagId, [wordId+tagId]',
  };
}
