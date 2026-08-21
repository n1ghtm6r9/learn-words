import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildExportPayload } from './buildExportPayload';
import type { Word } from '@/db/word.type';

function baseWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 1,
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

    expect(payload.version).toBe(2);
    expect(payload.exportedAt).toBe(1700000000000);
  });

  it('strips the id from each word', () => {
    const payload = buildExportPayload({ words: [baseWord({ id: 5, term: 'dog' })] });

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
});
