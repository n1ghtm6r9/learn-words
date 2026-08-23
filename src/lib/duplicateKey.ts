import { normalizeTerm } from './normalizeTerm';

const INFINITIVE_MARKER = /^to\s+/;

export function duplicateKey(term: string): string {
  const normalized = normalizeTerm(term).toLowerCase();
  const withoutMarker = normalized.replace(INFINITIVE_MARKER, '');
  return withoutMarker === '' ? normalized : withoutMarker;
}
