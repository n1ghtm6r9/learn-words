import { useUIStore } from '@/store/useUIStore';
import { TRANSLATIONS } from '@/i18n/translations';
import type { TranslationKeys } from '@/i18n/translationKeys.type';

export function useTranslation(): TranslationKeys {
  return TRANSLATIONS[useUIStore((s) => s.language)];
}
