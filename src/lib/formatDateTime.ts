import type { Language } from '@/store/language.type';

const LOCALES: Record<Language, string> = { ru: 'ru-RU', en: 'en-US' };

export function formatDateTime(timestamp: number, language: Language): string {
  return new Date(timestamp).toLocaleString(LOCALES[language], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
