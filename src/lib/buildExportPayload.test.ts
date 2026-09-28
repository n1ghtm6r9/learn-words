import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWord } from '@/db/createWord';
import { buildExportPayload } from './buildExportPayload';
import type { Word } from '@/db/word.type';

function baseWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 'w1',
    term: 'cat',
    translation: 'кот',
    createdAt: 0,
    kind: 'word',
    stage: 'new',
    learningPhase: 'A',
    phaseStreak: 0,
    stability: 1,
    difficulty: 5,
    reviewStreak: 0,
    ...overrides,
  };
}

describe('buildExportPayload', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('stamps the payload version and the current timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1700000000000);

    const payload = buildExportPayload({});

    expect(payload.version).toBe(4);
    expect(payload.exportedAt).toBe(1700000000000);
  });

  it('strips the id from each word', () => {
    const payload = buildExportPayload({ words: [baseWord({ id: 'w5', term: 'dog' })] });

    expect(payload.words).toEqual([
      {
        term: 'dog',
        translation: 'кот',
        createdAt: 0,
        kind: 'word',
        stage: 'new',
        learningPhase: 'A',
        phaseStreak: 0,
        stability: 1,
        difficulty: 5,
        reviewStreak: 0,
      },
    ]);
    expect(payload.words?.[0]).not.toHaveProperty('id');
  });

  it('strips the folder link and the cloud bookkeeping fields', () => {
    const word = { ...baseWord({ folderId: 'f1' }), owner: 'someone', realmId: 'realm' };

    const payload = buildExportPayload({ words: [word] });

    expect(payload.words?.[0]).not.toHaveProperty('folderId');
    expect(payload.words?.[0]).not.toHaveProperty('owner');
    expect(payload.words?.[0]).not.toHaveProperty('realmId');
  });

  it('omits the words field when no words are provided', () => {
    const payload = buildExportPayload({});

    expect(payload.words).toBeUndefined();
  });

  it('includes an explicitly empty words array', () => {
    const payload = buildExportPayload({ words: [] });

    expect(payload.words).toEqual([]);
  });

  it('includes settings when provided', () => {
    const settings = {
      theme: 'dark' as const,
      accentColor: 'blue' as const,
      language: 'en' as const,
      studyLanguage: 'es' as const,
      phaseARepeats: 3,
      phaseBRepeats: 4,
      reviewLimit: 40,
    };

    const payload = buildExportPayload({ settings });

    expect(payload.settings).toEqual(settings);
  });

  it('omits the settings field when not provided', () => {
    const payload = buildExportPayload({});

    expect(payload.settings).toBeUndefined();
  });

  it('names the folder and tags of every word and lists all folders and tags in order', () => {
    const payload = buildExportPayload({
      words: [
        { ...createWord('go', 'идти'), id: 'w1', folderId: 'f1' },
        { ...createWord('cat', 'кот'), id: 'w2' },
      ],
      folders: [
        { id: 'f2', name: 'Empty', color: 'pink', order: 2 },
        { id: 'f1', name: 'Travel', color: 'blue', order: 1, owner: 'me', realmId: 'me' } as never,
      ],
      tags: [{ id: 't1', name: 'verbs', color: 'green', order: 1 }],
      links: [
        { id: 'l1', wordId: 'w1', tagId: 't1' },
        { id: 'l2', wordId: 'w1', tagId: 'gone' },
      ],
    });

    expect(payload.folders).toEqual([
      { name: 'Travel', color: 'blue', order: 1 },
      { name: 'Empty', color: 'pink', order: 2 },
    ]);
    expect(payload.tags).toEqual([{ name: 'verbs', color: 'green', order: 1 }]);
    expect(payload.words?.[0]).toMatchObject({ term: 'go', folder: 'Travel', tags: ['verbs'] });
    expect(payload.words?.[1]).not.toHaveProperty('folder');
    expect(payload.words?.[1]).not.toHaveProperty('tags');
  });
});

