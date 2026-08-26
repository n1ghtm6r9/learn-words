import type { StudyLanguage } from '@/store/studyLanguage.type';
import { dbNameFor } from './dbNameFor';
import { VocabDB } from './VocabDB';

const instances = new Map<StudyLanguage, VocabDB>();

export function getDb(language: StudyLanguage): VocabDB {
  const existing = instances.get(language);
  if (existing) return existing;

  const created = new VocabDB(dbNameFor(language));
  instances.set(language, created);
  return created;
}
