import { useUIStore } from '@/store/useUIStore';
import { getDb } from './getDb';
import type { VocabDB } from './VocabDB';

export function useDb(): VocabDB {
  return getDb(useUIStore((s) => s.studyLanguage));
}
