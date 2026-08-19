import { db } from '@/db/db';
import type { Word } from '@/db/word.type';
import { clamp } from '@/lib/clamp';
import { detectWordKind } from '@/lib/detectWordKind';
import { normalizeTerm } from '@/lib/normalizeTerm';
import { roundRating } from '@/lib/roundRating';
import { useUIStore } from '@/store/useUIStore';
import type { ImportResult } from './importResult.type';
import type { ParsedImportPayload } from './parsedImportPayload.type';

const MAX_IMPORTED_STREAK = 1000;

type ImportedWord = ParsedImportPayload['words'][number];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function importedStreak(value: unknown): number {
  return isFiniteNumber(value) ? clamp(Math.floor(value), 0, MAX_IMPORTED_STREAK) : 0;
}

function importedTimestamp(value: unknown, now: number): number | null {
  return isFiniteNumber(value) && value >= 0 && value <= now ? value : null;
}

function buildWord(entry: ImportedWord, term: string, translation: string, now: number): Word {
  const stage = entry.stage === 'new' || entry.stage === 'review' ? entry.stage : 'new';
  const learningPhase = entry.learningPhase === 'A' || entry.learningPhase === 'B' ? entry.learningPhase : 'A';
  const kind = entry.kind === 'word' || entry.kind === 'phrase' ? entry.kind : detectWordKind(term);

  const word: Word = {
    term,
    translation,
    createdAt: importedTimestamp(entry.createdAt, now) ?? now,
    kind,
    stage,
    learningPhase,
    phaseStreak: importedStreak(entry.phaseStreak),
    rating: isFiniteNumber(entry.rating) ? clamp(roundRating(entry.rating), 0, 100) : 0,
    reviewStreak: importedStreak(entry.reviewStreak),
  };

  const lastReviewedAt = importedTimestamp(entry.lastReviewedAt, now);
  if (lastReviewedAt !== null) {
    word.lastReviewedAt = lastReviewedAt;
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
    if (term === '' || translation === '') continue;
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
): Promise<ImportResult> {
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let settingsApplied = false;

  if (options.importWords && parsed.words.length > 0) {
    const now = Date.now();
    const unique = dedupeByNormalizedTerm(parsed.words);
    const existingByTerm = new Map((await db.words.toArray()).map((w) => [w.term.toLowerCase(), w]));

    const toAdd: Word[] = [];
    const toUpdate: Word[] = [];

    for (const { entry, term, translation, key } of unique) {
      const candidate = buildWord(entry, term, translation, now);
      const existing = existingByTerm.get(key);

      if (!existing) {
        toAdd.push(candidate);
        continue;
      }
      if ((candidate.lastReviewedAt ?? 0) > (existing.lastReviewedAt ?? 0)) {
        toUpdate.push({ ...candidate, id: existing.id });
      }
    }

    if (toAdd.length > 0) {
      await db.words.bulkAdd(toAdd);
    }
    if (toUpdate.length > 0) {
      await db.words.bulkPut(toUpdate);
    }
    importedCount = toAdd.length;
    updatedCount = toUpdate.length;
    skippedCount = parsed.words.length - toAdd.length - toUpdate.length;
  }

  if (options.importSettings && parsed.settings) {
    const { theme, accentColor, language, phaseARepeats, phaseBRepeats } = parsed.settings;
    const store = useUIStore.getState();
    if (theme !== undefined) store.setTheme(theme);
    if (accentColor !== undefined) store.setAccentColor(accentColor);
    if (language !== undefined) store.setLanguage(language);
    if (phaseARepeats !== undefined) store.setPhaseARepeats(phaseARepeats);
    if (phaseBRepeats !== undefined) store.setPhaseBRepeats(phaseBRepeats);
    settingsApplied = true;
  }

  return { importedCount, updatedCount, skippedCount, settingsApplied };
}
