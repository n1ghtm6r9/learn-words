import type { WordKind } from '@/db/wordKind.type';
import type { StudyLanguage } from '@/store/studyLanguage.type';
import { LEXICAL_PREFIX } from './lexicalPrefix';
import { VERB_PARTICLES } from './verbParticles';

function withoutLexicalPrefix(term: string, language: StudyLanguage): string {
  const prefix = LEXICAL_PREFIX[language];
  if (prefix === null) return term;

  const stripped = term.replace(prefix, '');
  return stripped === '' ? term : stripped;
}

function isParticleVerb(tokens: string[], particles: ReadonlySet<string>): boolean {
  return tokens.length === 2 && particles.has(tokens[1].toLowerCase());
}

export function detectWordKind(term: string, language: StudyLanguage = 'en'): WordKind {
  const lexeme = withoutLexicalPrefix(term.trim().toLowerCase(), language);
  const tokens = lexeme.split(/\s+/).filter(Boolean);

  if (tokens.length <= 1) return 'word';
  if (isParticleVerb(tokens, VERB_PARTICLES[language])) return 'word';
  return 'phrase';
}
