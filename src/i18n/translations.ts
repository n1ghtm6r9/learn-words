import { ENGLISH_TRANSLATIONS } from './english/englishTranslations';
import { RUSSIAN_TRANSLATIONS } from './russian/russianTranslations';
import type { TranslationKeys } from '@/i18n/translationKeys.type';
import type { UiLanguage } from './uiLanguage.type';

export const TRANSLATIONS: Record<UiLanguage, TranslationKeys> = {
  ru: RUSSIAN_TRANSLATIONS,
  en: ENGLISH_TRANSLATIONS,
};
