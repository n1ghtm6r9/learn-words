import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';
import { STUDY_LANGUAGES } from '@/languages/studyLanguages';
import { getDb } from '../getDb';
import { migrateLegacyDatabase } from './migrateLegacyDatabase';

export async function migrateLegacyDatabases(): Promise<void> {
  for (const language of STUDY_LANGUAGES) {
    try {
      await migrateLegacyDatabase(getDb(language), STUDY_LANGUAGE_PROFILES[language].databaseName);
    } catch {}
  }
}
