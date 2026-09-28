import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { getStore } from './getStore';
import { VocabDB } from './VocabDB';

const instances = new Map<StudyLanguage, VocabDB>();

export function getDb(language: StudyLanguage): VocabDB {
  const existing = instances.get(language);
  if (existing) return existing;

  const created = new VocabDB(getStore(), language);
  instances.set(language, created);
  return created;
}
