import { beforeEach, describe, expect, it } from 'vitest';
import { createWord, db } from './db';

describe('VocabDB', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.reviews.clear();
  });

  it('creates a word with default SRS state due immediately', () => {
    const before = Date.now();
    const word = createWord('hello', 'привет');
    const after = Date.now();

    expect(word.term).toBe('hello');
    expect(word.translation).toBe('привет');
    expect(word.easinessFactor).toBe(2.5);
    expect(word.interval).toBe(0);
    expect(word.repetitions).toBe(0);
    expect(word.dueDate).toBeGreaterThanOrEqual(before);
    expect(word.dueDate).toBeLessThanOrEqual(after);
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
