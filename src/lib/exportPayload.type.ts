import type { Word } from '@/db/word.type';
import type { Theme } from '@/store/theme.type';
import type { AccentColor } from '@/store/accentColor.type';
import type { Language } from '@/store/language.type';

export interface ExportPayload {
  version: 1;
  exportedAt: number;
  words?: Array<Omit<Word, 'id'>>;
  settings?: {
    theme: Theme;
    accentColor: AccentColor;
    language: Language;
    phaseARepeats: number;
    phaseBRepeats: number;
  };
}
