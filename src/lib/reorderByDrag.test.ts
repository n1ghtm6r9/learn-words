import { describe, expect, it } from 'vitest';
import { reorderByDrag } from './reorderByDrag';

const ITEMS = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

describe('reorderByDrag', () => {
  it('moves an item up to the position it was dropped on', () => {
    expect(reorderByDrag(ITEMS, 3, 1).map((i) => i.id)).toEqual([3, 1, 2, 4]);
  });

  it('moves an item down to the position it was dropped on', () => {
    expect(reorderByDrag(ITEMS, 1, 3).map((i) => i.id)).toEqual([2, 3, 1, 4]);
  });

  it('moves an item to the very end', () => {
    expect(reorderByDrag(ITEMS, 1, 4).map((i) => i.id)).toEqual([2, 3, 4, 1]);
  });

  it('leaves the list alone when dropped on itself', () => {
    expect(reorderByDrag(ITEMS, 2, 2)).toBe(ITEMS);
  });

  it('leaves the list alone when an id is unknown', () => {
    expect(reorderByDrag(ITEMS, 99, 1)).toBe(ITEMS);
    expect(reorderByDrag(ITEMS, 1, 99)).toBe(ITEMS);
  });

  it('never mutates the list it was given', () => {
    const before = ITEMS.map((i) => i.id);
    reorderByDrag(ITEMS, 1, 3);
    expect(ITEMS.map((i) => i.id)).toEqual(before);
  });
});
