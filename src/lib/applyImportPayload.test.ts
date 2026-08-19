import { beforeEach, describe, expect, it, vi } from 'vitest';
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
      replaceExisting: false,
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
      replaceExisting: false,
    });

    expect(result.importedCount).toBe(0);
    expect(await db.words.count()).toBe(0);
  });

  it('dedupes identical repeated terms within the batch, keeping the first occurrence', async () => {
    const result = await applyImportPayload(
      payload({
        words: [
          { term: 'cat', translation: 'кот' },
          { term: 'cat', translation: 'котик' },
        ],
      }),
      { importWords: true, importSettings: false, replaceExisting: false },
    );

    expect(result.importedCount).toBe(1);
    const words = await db.words.toArray();
    expect(words).toHaveLength(1);
    expect(words[0].translation).toBe('кот');
  });

  it('treats terms differing only by case as one word, matching the rest of the app', async () => {
    const result = await applyImportPayload(
      payload({
        words: [
          { term: 'cat', translation: 'кот', rating: 10 },
          { term: 'Cat', translation: 'Кот', rating: 90 },
        ],
      }) as ParsedImportPayload,
      { importWords: true, importSettings: false, replaceExisting: false },
    );

    expect(result.importedCount).toBe(1);
    const words = await db.words.toArray();
    expect(words.map((w) => w.term)).toEqual(['cat']);
  });

  it('skips a word already in the dictionary when replacing is not requested', async () => {
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
          { term: 'cat', translation: 'котик' },
          { term: 'dog', translation: 'собака' },
        ],
      }),
      { importWords: true, importSettings: false, replaceExisting: false },
    );

    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    const words = await db.words.toArray();
    expect(words.map((w) => w.term).sort()).toEqual(['cat', 'dog']);
    expect(words.find((w) => w.term === 'cat')?.translation).toBe('кот');
  });

  it('matches an existing word case-insensitively, the same way the rest of the app does', async () => {
    await db.words.add({
      term: 'Hello',
      translation: 'привет',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 50,
      reviewStreak: 0,
    });

    const result = await applyImportPayload(
      payload({ words: [{ term: 'hello', translation: 'привет', rating: 90 }] }) as ParsedImportPayload,
      { importWords: true, importSettings: false, replaceExisting: true },
    );

    expect(result.importedCount).toBe(0);
    expect(result.updatedCount).toBe(1);
    const words = await db.words.toArray();
    expect(words).toHaveLength(1);
    expect(words[0].rating).toBe(90);
  });

  it('rolls the whole import back when a write fails, leaving nothing half-applied', async () => {
    await db.words.add({
      term: 'existing',
      translation: 'существующее',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 10,
      reviewStreak: 0,
    });

    const bulkPutSpy = vi.spyOn(db.words, 'bulkPut').mockRejectedValueOnce(new Error('quota'));

    await expect(
      applyImportPayload(
        payload({
          words: [
            { term: 'fresh', translation: 'новое' },
            { term: 'existing', translation: 'существующее', rating: 99 },
          ],
        }) as ParsedImportPayload,
        { importWords: true, importSettings: false, replaceExisting: true },
      ),
    ).rejects.toThrow();

    const words = await db.words.toArray();
    expect(words.map((w) => w.term)).toEqual(['existing']);
    expect(words[0].rating).toBe(10);

    bulkPutSpy.mockRestore();
  });

  it('drops an entry whose term is only invisible characters', async () => {
    const zeroWidthJoiner = String.fromCodePoint(0x200d);
    const result = await applyImportPayload(
      payload({ words: [{ term: zeroWidthJoiner, translation: 'невидимое' }] }),
      { importWords: true, importSettings: false, replaceExisting: false },
    );

    expect(result.importedCount).toBe(0);
    expect(await db.words.count()).toBe(0);
  });

  it('counts only real collisions as skipped, not malformed or repeated entries', async () => {
    const result = await applyImportPayload(
      payload({
        words: [
          { term: 'cat', translation: 'кот' },
          { term: 'cat', translation: 'дубль' },
          { term: '""', translation: 'мусор' },
        ],
      }),
      { importWords: true, importSettings: false, replaceExisting: false },
    );

    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
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
      { importWords: true, importSettings: false, replaceExisting: false },
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
      { importWords: true, importSettings: false, replaceExisting: false },
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
      { importWords: true, importSettings: false, replaceExisting: false },
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
      { importWords: true, importSettings: false, replaceExisting: false },
    );

    const words = await db.words.toArray();
    expect(words.find((w) => w.term === 'toohigh')?.rating).toBe(100);
    expect(words.find((w) => w.term === 'toolow')?.rating).toBe(0);
  });

  it('restores progress onto an existing word when replacing is requested', async () => {
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
      { importWords: true, importSettings: false, replaceExisting: true },
    );

    expect(result.updatedCount).toBe(1);
    expect(result.importedCount).toBe(0);

    const words = await db.words.toArray();
    expect(words).toHaveLength(1);
    expect(words[0]).toMatchObject({ term: 'cat', stage: 'review', rating: 88, reviewStreak: 9 });
  });

  it('restores learning-phase progress too, not just words that reached review', async () => {
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
        words: [{ term: 'cat', translation: 'кот', stage: 'new', learningPhase: 'B', phaseStreak: 2 }],
      }) as ParsedImportPayload,
      { importWords: true, importSettings: false, replaceExisting: true },
    );

    expect(result.updatedCount).toBe(1);
    const [word] = await db.words.toArray();
    expect(word.learningPhase).toBe('B');
    expect(word.phaseStreak).toBe(2);
  });

  it('leaves local progress untouched when replacing is not requested', async () => {
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
      { importWords: true, importSettings: false, replaceExisting: false },
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
      { importWords: true, importSettings: false, replaceExisting: false },
    );

    expect(result.importedCount).toBe(1);
    const words = await db.words.toArray();
    expect(words.map((w) => w.term)).toEqual(['real']);
  });

  it('pulls a future lastReviewedAt back to now instead of freezing the word out of review', async () => {
    const before = Date.now();
    await applyImportPayload(
      payload({ words: [{ term: 'future', translation: 'будущее', lastReviewedAt: 9e15 }] }) as ParsedImportPayload,
      { importWords: true, importSettings: false, replaceExisting: false },
    );

    const [word] = await db.words.toArray();
    expect(word.lastReviewedAt).toBeGreaterThanOrEqual(before);
    expect(word.lastReviewedAt).toBeLessThanOrEqual(Date.now());
  });

  it('keeps a slightly-ahead timestamp from another device rather than discarding the progress', async () => {
    const slightlyAhead = Date.now() + 30_000;
    await applyImportPayload(
      payload({
        words: [{ term: 'skewed', translation: 'сдвиг', lastReviewedAt: slightlyAhead }],
      }) as ParsedImportPayload,
      { importWords: true, importSettings: false, replaceExisting: false },
    );

    const [word] = await db.words.toArray();
    expect(word.lastReviewedAt).toBeDefined();
  });

  it('ignores a negative lastReviewedAt instead of storing it', async () => {
    await applyImportPayload(
      payload({ words: [{ term: 'skewed', translation: 'кривое', lastReviewedAt: -999 }] }) as ParsedImportPayload,
      { importWords: true, importSettings: false, replaceExisting: false },
    );

    const [word] = await db.words.toArray();
    expect(word.lastReviewedAt).toBeUndefined();
  });

  it('applies only the present settings fields via the matching store setters', async () => {
    const result = await applyImportPayload(payload({ settings: { theme: 'dark', phaseARepeats: 5 } }), {
      importWords: false,
      importSettings: true,
      replaceExisting: false,
    });

    expect(result.importedCount).toBe(0);
    expect(useUIStore.getState().theme).toBe('dark');
    expect(useUIStore.getState().phaseARepeats).toBe(5);
    expect(useUIStore.getState().accentColor).toBe('blue');
  });

  it('does not touch settings when importSettings is false', async () => {
    await applyImportPayload(
      payload({ settings: { theme: 'dark', accentColor: 'green', language: 'en', phaseARepeats: 5, phaseBRepeats: 5 } }),
      { importWords: false, importSettings: false, replaceExisting: false },
    );

    expect(useUIStore.getState().theme).toBe('light');
  });
});
