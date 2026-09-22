import { describe, expect, it } from 'vitest';
import type { Word } from '@/db/word.type';
import { filterWordsByScope } from './filterWordsByScope';
import { tagsByWord } from './tagsByWord';

function word(id: number, term: string, folderId?: number): Word {
  return {
    id,
    term,
    translation: term,
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

const WORDS = [word(1, 'loose'), word(2, 'work-one', 10), word(3, 'work-two', 10), word(4, 'travel', 20)];

const LINKS = tagsByWord([
  { wordId: 1, tagId: 100 },
  { wordId: 2, tagId: 100 },
  { wordId: 2, tagId: 200 },
  { wordId: 3, tagId: 200 },
]);

describe('filterWordsByScope', () => {
  it('returns every word when the scope is the whole deck', () => {
    const kept = filterWordsByScope(WORDS, { folderId: 'all', tagIds: [] }, LINKS);
    expect(kept).toHaveLength(4);
  });

  it('keeps only the words of the chosen folder', () => {
    const kept = filterWordsByScope(WORDS, { folderId: 10, tagIds: [] }, LINKS);
    expect(kept.map((w) => w.term)).toEqual(['work-one', 'work-two']);
  });

  it('keeps only the words outside any folder', () => {
    const kept = filterWordsByScope(WORDS, { folderId: null, tagIds: [] }, LINKS);
    expect(kept.map((w) => w.term)).toEqual(['loose']);
  });

  it('keeps the words carrying the chosen tag', () => {
    const kept = filterWordsByScope(WORDS, { folderId: 'all', tagIds: [200] }, LINKS);
    expect(kept.map((w) => w.term)).toEqual(['work-one', 'work-two']);
  });

  it('demands every chosen tag rather than any of them', () => {
    const kept = filterWordsByScope(WORDS, { folderId: 'all', tagIds: [100, 200] }, LINKS);
    expect(kept.map((w) => w.term)).toEqual(['work-one']);
  });

  it('intersects the folder with the tags', () => {
    const kept = filterWordsByScope(WORDS, { folderId: 10, tagIds: [100] }, LINKS);
    expect(kept.map((w) => w.term)).toEqual(['work-one']);
  });

  it('returns nothing when the folder and the tag never meet', () => {
    const kept = filterWordsByScope(WORDS, { folderId: 20, tagIds: [100] }, LINKS);
    expect(kept).toEqual([]);
  });

  it('drops untagged words as soon as a tag is demanded', () => {
    const kept = filterWordsByScope(WORDS, { folderId: 'all', tagIds: [100] }, LINKS);
    expect(kept.map((w) => w.term)).toEqual(['loose', 'work-one']);
  });
});

describe('tagsByWord', () => {
  it('groups the links by word', () => {
    const grouped = tagsByWord([
      { wordId: 1, tagId: 7 },
      { wordId: 1, tagId: 8 },
      { wordId: 2, tagId: 7 },
    ]);

    expect(grouped.get(1)).toEqual([7, 8]);
    expect(grouped.get(2)).toEqual([7]);
    expect(grouped.has(3)).toBe(false);
  });
});
