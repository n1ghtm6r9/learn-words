import { TRANSLATIONS } from '@/i18n/translations';
import type { UiLanguage } from './uiLanguage.type';

export const UI_LANGUAGES = Object.keys(TRANSLATIONS) as UiLanguage[];
