import type { StudyLanguage } from '@/store/studyLanguage.type';

export const INFINITIVE_MARKER: Record<StudyLanguage, RegExp | null> = {
  en: /^to\s+/,
  es: null,
};
