import { STUDY_LANGUAGES } from '@/languages/studyLanguages';
import { getDb } from '../getDb';
import { mergeDuplicates } from './mergeDuplicates';

export async function mergeAllLanguages(): Promise<void> {
  for (const language of STUDY_LANGUAGES) {
    await mergeDuplicates(getDb(language));
  }
}
