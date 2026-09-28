import { STUDY_LANGUAGES } from '@/languages/studyLanguages';
import { languageTableNames } from './languageTableNames';

export const SYNCED_TABLE_NAMES: string[] = STUDY_LANGUAGES.flatMap((language) =>
  Object.values(languageTableNames(language)),
);
