import { useUIStore } from '@/store/useUIStore';
import { TRANSLATIONS } from './translations';
import type { TranslationKeys } from './translationKeys.type';

export function useTranslation(): TranslationKeys {
  const language = useUIStore((s) => s.language);
  return TRANSLATIONS[language];
}
