import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';

export function contract(text: string, language: StudyLanguage = 'en'): string {
  return STUDY_LANGUAGE_PROFILES[language].contractions.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text,
  );
}
