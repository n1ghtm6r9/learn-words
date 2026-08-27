import type { StudyLanguageProfile } from '../studyLanguageProfile.type';
import { ENGLISH_CONTRACTIONS } from './englishContractions';
import { ENGLISH_VERB_PARTICLES } from './englishVerbParticles';

const INFINITIVE_MARKER = /^to\s+/;

export const ENGLISH_PROFILE: StudyLanguageProfile = {
  name: 'English',
  speechLang: 'en-US',
  databaseName: 'vocab-db',
  verbParticles: ENGLISH_VERB_PARTICLES,
  lexicalPrefix: INFINITIVE_MARKER,
  duplicatePrefix: INFINITIVE_MARKER,
  contractions: ENGLISH_CONTRACTIONS,
};
