import { ENGLISH_PROFILE } from './english/englishProfile';
import { SPANISH_PROFILE } from './spanish/spanishProfile';
import type { StudyLanguage } from '@/languages/studyLanguage.type';
import type { StudyLanguageProfile } from './studyLanguageProfile.type';

export const STUDY_LANGUAGE_PROFILES: Record<StudyLanguage, StudyLanguageProfile> = {
  en: ENGLISH_PROFILE,
  es: SPANISH_PROFILE,
};
