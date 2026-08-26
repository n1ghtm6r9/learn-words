import type { StudyLanguage } from '@/store/studyLanguage.type';

export const LEXICAL_PREFIX: Record<StudyLanguage, RegExp | null> = {
  en: /^to\s+/,
  es: /^(?:el|la|los|las|un|una|unos|unas)\s+/,
};
