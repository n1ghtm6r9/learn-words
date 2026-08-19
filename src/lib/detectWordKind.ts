import type { WordKind } from '@/db/wordKind.type';
import { PHRASAL_VERB_PARTICLES } from './phrasalVerbParticles';

function isPhrasalVerb(tokens: string[]): boolean {
  return tokens.length === 2 && PHRASAL_VERB_PARTICLES.has(tokens[1].toLowerCase());
}

export function detectWordKind(term: string): WordKind {
  const tokens = term.trim().split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) return 'word';
  if (isPhrasalVerb(tokens)) return 'word';
  return 'phrase';
}
