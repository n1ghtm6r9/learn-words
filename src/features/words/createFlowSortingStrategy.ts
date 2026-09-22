import { arrayMove, type SortingStrategy } from '@dnd-kit/sortable';

interface Bounds {
  left: number;
  right: number;
}

export function createFlowSortingStrategy(getBounds: () => Bounds | null, gap: number): SortingStrategy {
  return ({ rects, activeIndex, overIndex, index }) => {
    const bounds = getBounds();
    const first = rects[0];
    if (!bounds || !first || activeIndex < 0 || overIndex < 0) return null;

    const order = arrayMove(
      rects.map((_, position) => position),
      activeIndex,
      overIndex,
    );
    const rowStep = first.height + gap;

    let x = first.left;
    let y = first.top;
    for (const position of order) {
      const rect = rects[position];
      if (x > bounds.left && x + rect.width > bounds.right) {
        x = bounds.left;
        y += rowStep;
      }
      if (position === index) {
        return { x: x - rect.left, y: y - rect.top, scaleX: 1, scaleY: 1 };
      }
      x += rect.width + gap;
    }
    return null;
  };
}
