import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';
import { normalizeTerm } from './normalizeTerm';

export function duplicateKey(term: string, language: StudyLanguage = 'en'): string {
  const normalized = normalizeTerm(term).toLowerCase();
  const prefix = STUDY_LANGUAGE_PROFILES[language].duplicatePrefix;
  if (prefix === null) return normalized;

  const withoutPrefix = normalized.replace(prefix, '');
  return withoutPrefix === '' ? normalized : withoutPrefix;
}
