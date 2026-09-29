import type { Theme } from '@/store/theme.type';
import type { AccentColor } from '@/store/accentColor.type';
import type { UiLanguage } from '@/i18n/uiLanguage.type';
import type { StudyLanguage } from '@/languages/studyLanguage.type';
import type { ExportedLabel } from './exportedLabel.type';
import type { ExportedWord } from './exportedWord.type';

export interface ExportPayload {
  version: 4;
  exportedAt: number;
  words?: ExportedWord[];
  folders?: ExportedLabel[];
  tags?: ExportedLabel[];
  settings?: {
    theme: Theme;
    accentColor: AccentColor;
    language: UiLanguage;
    studyLanguage: StudyLanguage;
    phaseARepeats: number;
    phaseBRepeats: number;
    reviewLimit: number;
    keyboardSuggestions: boolean;
    soundEffects: boolean;
  };
}
