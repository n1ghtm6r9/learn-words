import type { StudyLanguage } from '@/store/studyLanguage.type';
import { PHRASAL_VERB_PARTICLES } from './phrasalVerbParticles';
import { SPANISH_VERB_PARTICLES } from './spanishVerbParticles';

export const VERB_PARTICLES: Record<StudyLanguage, ReadonlySet<string>> = {
  en: PHRASAL_VERB_PARTICLES,
  es: SPANISH_VERB_PARTICLES,
};
