import { describe, expect, it } from 'vitest';
import { createWord } from '@/db/createWord';
import type { Word } from '@/db/word.type';
import { syncSessionPool } from './syncSessionPool';

function word(id: string, term: string): Word {
  return { ...createWord(term, term), id };
}

describe('syncSessionPool', () => {
  it('starts the session with the stored words', () => {
    const stored = [word('a', 'cat')];

    expect(syncSessionPool(null, stored)).toBe(stored);
  });

  it('keeps the session copy of a word that is still stored', () => {
    const inSession = { ...word('a', 'cat'), phaseStreak: 2 };

    expect(syncSessionPool([inSession], [word('a', 'cat')])).toEqual([inSession]);
  });

  it('appends arrived words and drops the ones gone from the store', () => {
    const cat = word('a', 'cat');
    const dog = word('b', 'dog');
    const fox = word('c', 'fox');

    expect(syncSessionPool([cat, dog], [cat, fox])).toEqual([cat, fox]);
  });

  it('hands back the same pool when nothing changed', () => {
    const pool = [word('a', 'cat')];

    expect(syncSessionPool(pool, [word('a', 'cat')])).toBe(pool);
  });
});
