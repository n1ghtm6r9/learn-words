import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';
import { VocabDB } from './VocabDB';

const instances = new Map<StudyLanguage, VocabDB>();

export function getDb(language: StudyLanguage): VocabDB {
  const existing = instances.get(language);
  if (existing) return existing;

  const created = new VocabDB(STUDY_LANGUAGE_PROFILES[language].databaseName);
  instances.set(language, created);
  return created;
}
