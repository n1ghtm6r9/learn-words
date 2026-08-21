import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { createWord } from './createWord';

describe('VocabDB', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('persists and retrieves a word via Dexie', async () => {
    const word = createWord('cat', 'кот');
    const id = await db.words.add(word);

    const stored = await db.words.get(id);
    expect(stored?.term).toBe('cat');
    expect(stored?.stage).toBe('new');
  });

  it('filters words by stage using the stage index', async () => {
    await db.words.add(createWord('cat', 'кот'));
    await db.words.add({ ...createWord('dog', 'собака'), stage: 'review', stability: 5 });

    const newWords = await db.words.where('stage').equals('new').toArray();
    const reviewWords = await db.words.where('stage').equals('review').toArray();

    expect(newWords).toHaveLength(1);
    expect(newWords[0].term).toBe('cat');
    expect(reviewWords).toHaveLength(1);
    expect(reviewWords[0].term).toBe('dog');
  });
});
