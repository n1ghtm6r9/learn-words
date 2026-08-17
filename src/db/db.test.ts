import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { createWord } from './createWord';

describe('VocabDB', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.reviews.clear();
  });

  it('persists and retrieves a word via Dexie', async () => {
    const word = createWord('cat', 'кот');
    const id = await db.words.add(word);

    const stored = await db.words.get(id);
    expect(stored?.term).toBe('cat');
    expect(stored?.translation).toBe('кот');
  });

  it('persists a review log linked to a word', async () => {
    const wordId = await db.words.add(createWord('dog', 'собака'));
    await db.reviews.add({ wordId, reviewedAt: Date.now(), correct: true });

    const reviews = await db.reviews.where('wordId').equals(wordId).toArray();
    expect(reviews).toHaveLength(1);
    expect(reviews[0].correct).toBe(true);
  });
});
