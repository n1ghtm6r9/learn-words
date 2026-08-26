import type { StudyLanguage } from '@/store/studyLanguage.type';
import { INFINITIVE_MARKER } from './infinitiveMarker';
import { normalizeTerm } from './normalizeTerm';

export function duplicateKey(term: string, language: StudyLanguage = 'en'): string {
  const normalized = normalizeTerm(term).toLowerCase();
  const marker = INFINITIVE_MARKER[language];
  if (marker === null) return normalized;

  const withoutMarker = normalized.replace(marker, '');
  return withoutMarker === '' ? normalized : withoutMarker;
}
