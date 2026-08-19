import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { useUIStore } from '@/store/useUIStore';
import { applyImportPayload } from './applyImportPayload';
import type { ParsedImportPayload } from './parsedImportPayload.type';

function payload(overrides: Partial<ParsedImportPayload> = {}): ParsedImportPayload {
  return { valid: true, words: [], settings: null, ...overrides };
}

describe('applyImportPayload', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ theme: 'light', accentColor: 'blue', language: 'ru', phaseARepeats: 3, phaseBRepeats: 3 });
    window.localStorage.clear();
  });

  it('adds new words with normalized term and translation', async () => {
    const result = await applyImportPayload(payload({ words: [{ term: '  Cat  ', translation: '  Кот  ' }] }), {
      importWords: true,
      importSettings: false,
    });

    expect(result.importedCount).toBe(1);
    const words = await db.words.toArray();
    expect(words[0].term).toBe('Cat');
    expect(words[0].translation).toBe('Кот');
  });

  it('does nothing when importWords is false', async () => {
    const result = await applyImportPayload(payload({ words: [{ term: 'cat', translation: 'кот' }] }), {
      importWords: false,
      importSettings: false,
    });

    expect(result.importedCount).toBe(0);
    expect(await db.words.count()).toBe(0);
  });

  it('dedupes case-insensitively within the batch, keeping the first occurrence', async () => {
    const result = await applyImportPayload(
      payload({
        words: [
          { term: 'cat', translation: 'кот' },
          { term: 'CAT', translation: 'котик' },
        ],
      }),
      { importWords: true, importSettings: false },
    );

    expect(result.importedCount).toBe(1);
    const words = await db.words.toArray();
    expect(words).toHaveLength(1);
    expect(words[0].translation).toBe('кот');
  });

  it('skips words whose normalized term already exists in the dictionary', async () => {
    await db.words.add({
      term: 'cat',
      translation: 'кот',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 0,
      reviewStreak: 0,
    });

    const result = await applyImportPayload(
      payload({
        words: [
          { term: 'CAT', translation: 'котик' },
          { term: 'dog', translation: 'собака' },
        ],
      }),
      { importWords: true, importSettings: false },
    );

    expect(result.importedCount).toBe(1);
    const words = await db.words.toArray();
    expect(words.map((w) => w.term).sort()).toEqual(['cat', 'dog']);
  });

  it('uses valid imported progress fields instead of fresh-word defaults', async () => {
    await applyImportPayload(
      payload({
        words: [
          {
            term: 'cat',
            translation: 'кот',
            stage: 'review',
            learningPhase: 'B',
            phaseStreak: 2,
            rating: 75,
            reviewStreak: 4,
            lastReviewedAt: 12345,
            createdAt: 999,
            kind: 'phrase',
          },
        ],
      }),
      { importWords: true, importSettings: false },
    );

    const [word] = await db.words.toArray();
    expect(word.stage).toBe('review');
    expect(word.learningPhase).toBe('B');
    expect(word.phaseStreak).toBe(2);
    expect(word.rating).toBe(75);
    expect(word.reviewStreak).toBe(4);
    expect(word.lastReviewedAt).toBe(12345);
    expect(word.createdAt).toBe(999);
    expect(word.kind).toBe('phrase');
  });

  it('falls back to fresh-word defaults for structurally invalid fields', async () => {
    await applyImportPayload(
      payload({
        words: [
          {
            term: 'as soon as possible',
            translation: 'как можно скорее',
            stage: 'bogus',
            learningPhase: 'C',
            phaseStreak: 'lots',
            rating: Infinity,
            kind: 'sentence',
          },
        ] as unknown as ParsedImportPayload['words'],
      }),
      { importWords: true, importSettings: false },
    );

    const [word] = await db.words.toArray();
    expect(word.stage).toBe('new');
    expect(word.learningPhase).toBe('A');
    expect(word.phaseStreak).toBe(0);
    expect(word.rating).toBe(0);
    expect(word.kind).toBe('phrase');
    expect(word.lastReviewedAt).toBeUndefined();
  });

  it('clamps a negative reviewStreak, which would otherwise invert rating decay into growth', async () => {
    await applyImportPayload(
      payload({
        words: [{ term: 'corrupt', translation: 'испорчено', reviewStreak: -100, phaseStreak: -5 }],
      }) as ParsedImportPayload,
      { importWords: true, importSettings: false },
    );

    const [word] = await db.words.toArray();
    expect(word.reviewStreak).toBe(0);
    expect(word.phaseStreak).toBe(0);
  });

  it('clamps an out-of-range rating into the 0..100 scale', async () => {
    await applyImportPayload(
      payload({
        words: [
          { term: 'toohigh', translation: 'много', rating: 5000 },
          { term: 'toolow', translation: 'мало', rating: -42 },
        ],
      }) as ParsedImportPayload,
      { importWords: true, importSettings: false },
    );

    const words = await db.words.toArray();
    expect(words.find((w) => w.term === 'toohigh')?.rating).toBe(100);
    expect(words.find((w) => w.term === 'toolow')?.rating).toBe(0);
  });

  it('restores progress onto an existing word when the backup is newer', async () => {
    await db.words.add({
      term: 'cat',
      translation: 'кот',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 0,
      reviewStreak: 0,
    });

    const result = await applyImportPayload(
      payload({
        words: [
          {
            term: 'cat',
            translation: 'кот',
            stage: 'review',
            learningPhase: 'B',
            rating: 88,
            reviewStreak: 9,
            lastReviewedAt: 1000,
          },
        ],
      }) as ParsedImportPayload,
      { importWords: true, importSettings: false },
    );

    expect(result.updatedCount).toBe(1);
    expect(result.importedCount).toBe(0);

    const words = await db.words.toArray();
    expect(words).toHaveLength(1);
    expect(words[0]).toMatchObject({ term: 'cat', stage: 'review', rating: 88, reviewStreak: 9 });
  });

  it('does not let an older backup overwrite newer local progress', async () => {
    await db.words.add({
      term: 'cat',
      translation: 'кот',
      createdAt: 0,
      kind: 'word',
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 0,
      rating: 95,
      reviewStreak: 12,
      lastReviewedAt: 5000,
    });

    const result = await applyImportPayload(
      payload({
        words: [{ term: 'cat', translation: 'кот', stage: 'review', rating: 10, reviewStreak: 1, lastReviewedAt: 1000 }],
      }) as ParsedImportPayload,
      { importWords: true, importSettings: false },
    );

    expect(result.updatedCount).toBe(0);
    expect(result.skippedCount).toBe(1);

    const [word] = await db.words.toArray();
    expect(word.rating).toBe(95);
    expect(word.reviewStreak).toBe(12);
  });

  it('drops entries whose term is empty once invisible characters are stripped', async () => {
    const result = await applyImportPayload(
      payload({
        words: [
          { term: '​​', translation: 'пусто' },
          { term: '""', translation: 'кавычки' },
          { term: 'real', translation: 'настоящее' },
        ],
      }),
      { importWords: true, importSettings: false },
    );

    expect(result.importedCount).toBe(1);
    const words = await db.words.toArray();
    expect(words.map((w) => w.term)).toEqual(['real']);
  });

  it('ignores a lastReviewedAt in the future, which would freeze the word out of review forever', async () => {
    await applyImportPayload(
      payload({ words: [{ term: 'future', translation: 'будущее', lastReviewedAt: 9e15 }] }) as ParsedImportPayload,
      { importWords: true, importSettings: false },
    );

    const [word] = await db.words.toArray();
    expect(word.lastReviewedAt).toBeUndefined();
  });

  it('ignores a negative lastReviewedAt instead of storing it', async () => {
    await applyImportPayload(
      payload({ words: [{ term: 'skewed', translation: 'кривое', lastReviewedAt: -999 }] }) as ParsedImportPayload,
      { importWords: true, importSettings: false },
    );

    const [word] = await db.words.toArray();
    expect(word.lastReviewedAt).toBeUndefined();
  });

  it('applies only the present settings fields via the matching store setters', async () => {
    const result = await applyImportPayload(payload({ settings: { theme: 'dark', phaseARepeats: 5 } }), {
      importWords: false,
      importSettings: true,
    });

    expect(result.importedCount).toBe(0);
    expect(useUIStore.getState().theme).toBe('dark');
    expect(useUIStore.getState().phaseARepeats).toBe(5);
    expect(useUIStore.getState().accentColor).toBe('blue');
  });

  it('does not touch settings when importSettings is false', async () => {
    await applyImportPayload(
      payload({ settings: { theme: 'dark', accentColor: 'green', language: 'en', phaseARepeats: 5, phaseBRepeats: 5 } }),
      { importWords: false, importSettings: false },
    );

    expect(useUIStore.getState().theme).toBe('light');
  });
});
