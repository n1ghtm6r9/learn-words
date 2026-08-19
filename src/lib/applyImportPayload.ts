import { db } from '@/db/db';
import type { Word } from '@/db/word.type';
import { detectWordKind } from '@/lib/detectWordKind';
import { normalizeTerm } from '@/lib/normalizeTerm';
import { useUIStore } from '@/store/useUIStore';
import type { ParsedImportPayload } from './parsedImportPayload.type';

type ImportedWord = ParsedImportPayload['words'][number];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function buildWord(entry: ImportedWord, term: string, translation: string): Word {
  const stage = entry.stage === 'new' || entry.stage === 'review' ? entry.stage : 'new';
  const learningPhase = entry.learningPhase === 'A' || entry.learningPhase === 'B' ? entry.learningPhase : 'A';
  const kind = entry.kind === 'word' || entry.kind === 'phrase' ? entry.kind : detectWordKind(term);

  const word: Word = {
    term,
    translation,
    createdAt: isFiniteNumber(entry.createdAt) ? entry.createdAt : Date.now(),
    kind,
    stage,
    learningPhase,
    phaseStreak: isFiniteNumber(entry.phaseStreak) ? entry.phaseStreak : 0,
    rating: isFiniteNumber(entry.rating) ? entry.rating : 0,
    reviewStreak: isFiniteNumber(entry.reviewStreak) ? entry.reviewStreak : 0,
  };

  if (isFiniteNumber(entry.lastReviewedAt)) {
    word.lastReviewedAt = entry.lastReviewedAt;
  }

  return word;
}

function dedupeByNormalizedTerm(
  words: ImportedWord[],
): Array<{ entry: ImportedWord; term: string; translation: string; key: string }> {
  const seen = new Set<string>();
  const unique: Array<{ entry: ImportedWord; term: string; translation: string; key: string }> = [];

  for (const entry of words) {
    const term = normalizeTerm(entry.term);
    const translation = normalizeTerm(entry.translation);
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ entry, term, translation, key });
  }

  return unique;
}

export async function applyImportPayload(
  parsed: ParsedImportPayload,
  options: { importWords: boolean; importSettings: boolean },
): Promise<{ importedCount: number }> {
  let importedCount = 0;

  if (options.importWords && parsed.words.length > 0) {
    const unique = dedupeByNormalizedTerm(parsed.words);
    const existingTerms = new Set((await db.words.toArray()).map((w) => w.term.toLowerCase()));
    const toAdd = unique
      .filter(({ key }) => !existingTerms.has(key))
      .map(({ entry, term, translation }) => buildWord(entry, term, translation));

    if (toAdd.length > 0) {
      await db.words.bulkAdd(toAdd);
    }
    importedCount = toAdd.length;
  }

  if (options.importSettings && parsed.settings) {
    const { theme, accentColor, language, phaseARepeats, phaseBRepeats } = parsed.settings;
    const store = useUIStore.getState();
    if (theme !== undefined) store.setTheme(theme);
    if (accentColor !== undefined) store.setAccentColor(accentColor);
    if (language !== undefined) store.setLanguage(language);
    if (phaseARepeats !== undefined) store.setPhaseARepeats(phaseARepeats);
    if (phaseBRepeats !== undefined) store.setPhaseBRepeats(phaseBRepeats);
  }

  return { importedCount };
}
