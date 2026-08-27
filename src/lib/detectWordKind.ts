import type { WordKind } from '@/db/wordKind.type';
import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';

function withoutLexicalPrefix(term: string, prefix: RegExp | null): string {
  if (prefix === null) return term;

  const stripped = term.replace(prefix, '');
  return stripped === '' ? term : stripped;
}

function isParticleVerb(tokens: string[], particles: ReadonlySet<string>): boolean {
  return tokens.length === 2 && particles.has(tokens[1].toLowerCase());
}

export function detectWordKind(term: string, language: StudyLanguage = 'en'): WordKind {
  const profile = STUDY_LANGUAGE_PROFILES[language];
  const lexeme = withoutLexicalPrefix(term.trim().toLowerCase(), profile.lexicalPrefix);
  const tokens = lexeme.split(/\s+/).filter(Boolean);

  if (tokens.length <= 1) return 'word';
  if (isParticleVerb(tokens, profile.verbParticles)) return 'word';
  return 'phrase';
}
