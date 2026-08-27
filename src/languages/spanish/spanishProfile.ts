import type { StudyLanguageProfile } from '../studyLanguageProfile.type';
import { SPANISH_CONTRACTIONS } from './spanishContractions';
import { SPANISH_VERB_PARTICLES } from './spanishVerbParticles';

const ARTICLE = /^(?:el|la|los|las|un|una|unos|unas)\s+/;

export const SPANISH_PROFILE: StudyLanguageProfile = {
  name: 'Español',
  speechLang: 'es-ES',
  databaseName: 'vocab-db-es',
  verbParticles: SPANISH_VERB_PARTICLES,
  lexicalPrefix: ARTICLE,
  identityPrefix: null,
  contractions: SPANISH_CONTRACTIONS,
};
