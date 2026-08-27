import type { Word } from '@/db/word.type';
import type { Theme } from '@/store/theme.type';
import type { AccentColor } from '@/store/accentColor.type';
import type { Language } from '@/store/language.type';
import type { StudyLanguage } from '@/languages/studyLanguage.type';

export interface ExportPayload {
  version: 3;
  exportedAt: number;
  words?: Array<Omit<Word, 'id'>>;
  settings?: {
    theme: Theme;
    accentColor: AccentColor;
    language: Language;
    studyLanguage: StudyLanguage;
    phaseARepeats: number;
    phaseBRepeats: number;
    reviewLimit: number;
  };
}
