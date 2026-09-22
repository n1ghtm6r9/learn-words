import { describe, expect, it } from 'vitest';
import type { ClientRect } from '@dnd-kit/core';
import { createFlowSortingStrategy } from './createFlowSortingStrategy';

const GAP = 6;
const HEIGHT = 26;
const BOUNDS = { left: 0, right: 200 };

function rect(left: number, top: number, width: number): ClientRect {
  return { left, top, width, height: HEIGHT, right: left + width, bottom: top + HEIGHT };
}

const RECTS = [rect(100, 0, 80), rect(0, 32, 60), rect(66, 32, 100)];

function landing(activeIndex: number, overIndex: number) {
  const strategy = createFlowSortingStrategy(() => BOUNDS, GAP);
  return RECTS.map((original, index) => {
    const shift = strategy({ rects: RECTS, activeNodeRect: null, activeIndex, overIndex, index });
    return { left: original.left + (shift?.x ?? 0), top: original.top + (shift?.y ?? 0) };
  });
}

describe('createFlowSortingStrategy', () => {
  it('reflows chips of different widths into rows like the browser would', () => {
    const [first, second, third] = landing(2, 0);

    expect(third).toEqual({ left: 100, top: 0 });
    expect(first).toEqual({ left: 0, top: 32 });
    expect(second).toEqual({ left: 86, top: 32 });
  });

  it('never pushes a chip past the right edge', () => {
    const positions = landing(2, 0);

    positions.forEach((position, index) => {
      const width = [80, 60, 100][index];
      expect(position.left + width).toBeLessThanOrEqual(BOUNDS.right);
    });
  });

  it('keeps chips from overlapping on the same row', () => {
    const positions = landing(0, 2).map((position, index) => ({ ...position, width: [80, 60, 100][index] }));
    const byRow = new Map<number, typeof positions>();
    positions.forEach((position) => byRow.set(position.top, [...(byRow.get(position.top) ?? []), position]));

    for (const row of byRow.values()) {
      const sorted = [...row].sort((a, b) => a.left - b.left);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].left).toBeGreaterThanOrEqual(sorted[i - 1].left + sorted[i - 1].width);
      }
    }
  });

  it('leaves every chip in place when nothing moved', () => {
    expect(landing(1, 1)).toEqual(RECTS.map((original) => ({ left: original.left, top: original.top })));
  });

  it('does nothing without container bounds', () => {
    const strategy = createFlowSortingStrategy(() => null, GAP);
    expect(strategy({ rects: RECTS, activeNodeRect: null, activeIndex: 2, overIndex: 0, index: 0 })).toBeNull();
  });
});
