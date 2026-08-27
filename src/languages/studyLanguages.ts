import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { STUDY_LANGUAGE_PROFILES } from './studyLanguageProfiles';

export const STUDY_LANGUAGES = Object.keys(STUDY_LANGUAGE_PROFILES) as StudyLanguage[];
