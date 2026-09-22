import { describe, expect, it } from 'vitest';
import type { Word } from '@/db/word.type';
import { folderCounts } from './folderCounts';
import { tagCounts } from './tagCounts';

function word(id: number, folderId?: number): Word {
  return {
    id,
    term: `word-${id}`,
    translation: `перевод-${id}`,
    createdAt: 0,
    kind: 'word',
    stage: 'new',
    learningPhase: 'A',
    phaseStreak: 0,
    stability: 1,
    difficulty: 5,
    reviewStreak: 0,
    ...(folderId == null ? {} : { folderId }),
  };
}

describe('folderCounts', () => {
  it('counts the words of each folder', () => {
    const counts = folderCounts([word(1, 10), word(2, 10), word(3, 20)]);

    expect(counts.get(10)).toBe(2);
    expect(counts.get(20)).toBe(1);
  });

  it('counts the words outside any folder under null', () => {
    const counts = folderCounts([word(1), word(2), word(3, 10)]);

    expect(counts.get(null)).toBe(2);
    expect(counts.get(10)).toBe(1);
  });

  it('returns an empty map for an empty deck', () => {
    expect(folderCounts([]).size).toBe(0);
  });
});

describe('tagCounts', () => {
  it('counts the words carrying each tag', () => {
    const counts = tagCounts(
      [word(1), word(2)],
      [
        { wordId: 1, tagId: 100 },
        { wordId: 2, tagId: 100 },
        { wordId: 2, tagId: 200 },
      ],
    );

    expect(counts.get(100)).toBe(2);
    expect(counts.get(200)).toBe(1);
  });

  it('ignores links pointing at words that are not on the list', () => {
    const counts = tagCounts([word(1)], [
      { wordId: 1, tagId: 100 },
      { wordId: 99, tagId: 100 },
    ]);

    expect(counts.get(100)).toBe(1);
  });
});
