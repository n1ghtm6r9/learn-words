import type { StudyLanguageProfile } from '../studyLanguageProfile.type';
import { ENGLISH_CONTRACTIONS } from './englishContractions';
import { ENGLISH_VERB_PARTICLES } from './englishVerbParticles';

const ARTICLE_OR_INFINITIVE_MARKER = 'to|an?|the';
const MEANING_DEPENDS_ON_THE_ARTICLE = 'few|little|lot|lots|while|bit|couple|number|deal';

const LEADING_FUNCTION_WORD = new RegExp(
  `^(?:${ARTICLE_OR_INFINITIVE_MARKER})\\s+(?!(?:${MEANING_DEPENDS_ON_THE_ARTICLE})\\b)`,
);

export const ENGLISH_PROFILE: StudyLanguageProfile = {
  name: 'English',
  speechLang: 'en-US',
  databaseName: 'vocab-db',
  verbParticles: ENGLISH_VERB_PARTICLES,
  lexicalPrefix: LEADING_FUNCTION_WORD,
  identityPrefix: LEADING_FUNCTION_WORD,
  contractions: ENGLISH_CONTRACTIONS,
};
