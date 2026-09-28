import type { StudyLanguage } from '@/languages/studyLanguage.type';
import type { LanguageTables } from './languageTables.type';

export function languageTableNames(language: StudyLanguage): LanguageTables {
  return {
    words: `${language}Words`,
    folders: `${language}Folders`,
    tags: `${language}Tags`,
    wordTags: `${language}WordTags`,
  };
}
