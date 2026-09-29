import { ensureLabels } from '@/db/ensureLabels';
import { getDb } from '@/db/getDb';
import { isUsableWord } from '@/db/isUsableWord';
import { labelIdentityKey } from '@/db/merge/labelIdentityKey';
import type { Word } from '@/db/word.type';
import type { WordTag } from '@/db/wordTag.type';
import { clamp } from '@/lib/clamp';
import { detectWordKind } from '@/lib/detectWordKind';
import { duplicateKey } from '@/lib/duplicateKey';
import { normalizeTerm } from '@/lib/normalizeTerm';
import {
  DEFAULT_DIFFICULTY,
  INITIAL_STABILITY_DAYS,
  MAX_DIFFICULTY,
  MAX_STABILITY_DAYS,
  MIN_DIFFICULTY,
  MIN_STABILITY_DAYS,
} from '@/lib/memoryParams';
import { seedStabilityFromLegacyRating } from '@/lib/seedStabilityFromLegacyRating';
import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { useUIStore } from '@/store/useUIStore';
import type { ImportResult } from './importResult.type';
import type { ImportedWord } from './importedWord.type';
import type { ParsedImportPayload } from './parsedImportPayload.type';

const MAX_IMPORTED_STREAK = 1000;
const HAS_MEANINGFUL_CHARACTER = /[\p{L}\p{N}]/u;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function importedStreak(value: unknown): number {
  return isFiniteNumber(value) ? clamp(Math.floor(value), 0, MAX_IMPORTED_STREAK) : 0;
}

function importedTimestamp(value: unknown, now: number): number | null {
  if (!isFiniteNumber(value) || value <= 0) return null;
  return Math.min(value, now);
}

function importedStability(
  entry: ImportedWord,
  term: string,
  reviewStreak: number,
  stage: Word['stage'],
): number {
  if (isFiniteNumber(entry.stability)) {
    return clamp(entry.stability, MIN_STABILITY_DAYS, MAX_STABILITY_DAYS);
  }
  if (stage === 'review' && isFiniteNumber(entry.rating)) {
    return seedStabilityFromLegacyRating(entry.rating, reviewStreak, term);
  }
  return INITIAL_STABILITY_DAYS;
}

function importedDifficulty(value: unknown): number {
  return isFiniteNumber(value) ? clamp(value, MIN_DIFFICULTY, MAX_DIFFICULTY) : DEFAULT_DIFFICULTY;
}

function buildWord(
  entry: ImportedWord,
  term: string,
  translation: string,
  now: number,
  language: StudyLanguage,
): Word {
  const stage = entry.stage === 'new' || entry.stage === 'review' ? entry.stage : 'new';
  const learningPhase = entry.learningPhase === 'A' || entry.learningPhase === 'B' ? entry.learningPhase : 'A';
  const kind = entry.kind === 'word' || entry.kind === 'phrase' ? entry.kind : detectWordKind(term, language);

  const reviewStreak = importedStreak(entry.reviewStreak);

  const word: Word = {
    term,
    translation,
    createdAt: importedTimestamp(entry.createdAt, now) ?? now,
    kind,
    stage,
    learningPhase,
    phaseStreak: importedStreak(entry.phaseStreak),
    stability: importedStability(entry, term, reviewStreak, stage),
    difficulty: importedDifficulty(entry.difficulty),
    reviewStreak,
  };

  const lastReviewedAt = importedTimestamp(entry.lastReviewedAt, now);
  if (lastReviewedAt !== null) {
    word.lastReviewedAt = lastReviewedAt;
  } else if (stage === 'review') {
    word.lastReviewedAt = now;
  }

  return word;
}

function dedupeByNormalizedTerm(
  words: ImportedWord[],
  language: StudyLanguage,
): Array<{ entry: ImportedWord; term: string; translation: string }> {
  const seen = new Set<string>();
  const unique: Array<{ entry: ImportedWord; term: string; translation: string }> = [];

  for (const entry of words) {
    const term = normalizeTerm(entry.term);
    const translation = normalizeTerm(entry.translation);
    if (!HAS_MEANINGFUL_CHARACTER.test(term) || translation === '') continue;
    const key = duplicateKey(term, language);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ entry, term, translation });
  }

  return unique;
}

export async function applyImportPayload(
  parsed: ParsedImportPayload,
  options: { importWords: boolean; importSettings: boolean; replaceExisting: boolean },
): Promise<ImportResult> {
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let settingsApplied = false;

  const importedSettings = options.importSettings ? parsed.settings : null;
  const targetLanguage = importedSettings?.studyLanguage ?? useUIStore.getState().studyLanguage;

  const hasVocabulary = parsed.words.length > 0 || parsed.folders.length > 0 || parsed.tags.length > 0;
  if (options.importWords && hasVocabulary) {
    const now = Date.now();
    const db = getDb(targetLanguage);
    const unique = dedupeByNormalizedTerm(parsed.words, targetLanguage);

    await db.transaction('rw', db.words, db.folders, db.tags, db.wordTags, async () => {
      const folderIds = await ensureLabels(db.folders, [
        ...parsed.folders,
        ...unique.flatMap(({ entry }) => (entry.folder ? [{ name: entry.folder }] : [])),
      ]);
      const tagIds = await ensureLabels(db.tags, [
        ...parsed.tags,
        ...unique.flatMap(({ entry }) => (entry.tags ?? []).map((name) => ({ name }))),
      ]);
      const existingByTerm = new Map(
        (await db.words.toArray()).filter(isUsableWord).map((w) => [duplicateKey(w.term, targetLanguage), w]),
      );

      const toAdd: Word[] = [];
      const addedEntries: ImportedWord[] = [];
      const toUpdate: Word[] = [];
      const updatedEntries: ImportedWord[] = [];

      for (const { entry, term, translation } of unique) {
        const candidate = buildWord(entry, term, translation, now, targetLanguage);
        const existing = existingByTerm.get(duplicateKey(term, targetLanguage));
        const folderId = entry.folder ? folderIds.get(labelIdentityKey(entry.folder)) : undefined;

        if (!existing) {
          toAdd.push(folderId ? { ...candidate, folderId } : candidate);
          addedEntries.push(entry);
        } else if (options.replaceExisting) {
          const keptFolderId = folderId ?? existing.folderId;
          toUpdate.push(keptFolderId ? { ...candidate, id: existing.id, folderId: keptFolderId } : { ...candidate, id: existing.id });
          updatedEntries.push(entry);
        }
      }

      const addedIds = toAdd.length > 0 ? await db.words.bulkAdd(toAdd, { allKeys: true }) : [];
      if (toUpdate.length > 0) {
        await db.words.bulkPut(toUpdate);
      }

      const touched: Array<[string, ImportedWord]> = [
        ...addedEntries.map((entry, index): [string, ImportedWord] => [addedIds[index], entry]),
        ...updatedEntries.map((entry, index): [string, ImportedWord] => [toUpdate[index].id!, entry]),
      ];
      const linked = new Set(
        (await db.wordTags.where('wordId').anyOf(touched.map(([wordId]) => wordId)).toArray()).map(
          (link) => `${link.wordId}|${link.tagId}`,
        ),
      );
      const links: WordTag[] = [];
      for (const [wordId, entry] of touched) {
        for (const name of entry.tags ?? []) {
          const tagId = tagIds.get(labelIdentityKey(name));
          const pair = `${wordId}|${tagId}`;
          if (!tagId || linked.has(pair)) continue;
          linked.add(pair);
          links.push({ wordId, tagId });
        }
      }
      if (links.length > 0) {
        await db.wordTags.bulkAdd(links);
      }
      importedCount = toAdd.length;
      updatedCount = toUpdate.length;
      skippedCount = unique.length - toAdd.length - toUpdate.length;
    });
  }

  if (importedSettings) {
    const {
      theme,
      accentColor,
      language,
      studyLanguage,
      phaseARepeats,
      phaseBRepeats,
      reviewLimit,
      keyboardSuggestions,
    } = importedSettings;
    const store = useUIStore.getState();
    if (theme !== undefined) store.setTheme(theme);
    if (accentColor !== undefined) store.setAccentColor(accentColor);
    if (language !== undefined) store.setLanguage(language);
    if (studyLanguage !== undefined) store.setStudyLanguage(studyLanguage);
    if (phaseARepeats !== undefined) store.setPhaseARepeats(phaseARepeats);
    if (phaseBRepeats !== undefined) store.setPhaseBRepeats(phaseBRepeats);
    if (reviewLimit !== undefined) store.setReviewLimit(reviewLimit);
    if (keyboardSuggestions !== undefined) store.setKeyboardSuggestions(keyboardSuggestions);
    settingsApplied = true;
  }

  return { importedCount, updatedCount, skippedCount, settingsApplied };
}
