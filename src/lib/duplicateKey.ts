import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';
import { normalizeTerm } from './normalizeTerm';
import { withoutPrefix } from './withoutPrefix';

export function duplicateKey(term: string, language: StudyLanguage = 'en'): string {
  const normalized = normalizeTerm(term).toLowerCase();

  return withoutPrefix(normalized, STUDY_LANGUAGE_PROFILES[language].identityPrefix);
}
