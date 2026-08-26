import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from './getDb';
import { createWord } from './createWord';

const db = getDb('en');

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

describe('getDb', () => {
  it('reuses one instance per studied language', () => {
    expect(getDb('en')).toBe(getDb('en'));
    expect(getDb('en')).not.toBe(getDb('es'));
  });

  it('keeps every studied language in a dictionary of its own', async () => {
    const spanish = getDb('es');
    await db.words.clear();
    await spanish.words.clear();

    await db.words.add(createWord('cat', 'кот'));
    await spanish.words.add(createWord('gato', 'кот', 'es'));

    expect((await db.words.toArray()).map((w) => w.term)).toEqual(['cat']);
    expect((await spanish.words.toArray()).map((w) => w.term)).toEqual(['gato']);
  });
});
