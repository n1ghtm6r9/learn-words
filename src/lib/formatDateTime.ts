import type { UiLanguage } from '@/i18n/uiLanguage.type';

const LOCALES: Record<UiLanguage, string> = { ru: 'ru-RU', en: 'en-US' };

export function formatDateTime(timestamp: number, language: UiLanguage): string {
  return new Date(timestamp).toLocaleString(LOCALES[language], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
