import type { StudyLanguage } from '@/store/studyLanguage.type';

const BASE_DB_NAME = 'vocab-db';

export function dbNameFor(language: StudyLanguage): string {
  return language === 'en' ? BASE_DB_NAME : `${BASE_DB_NAME}-${language}`;
}
