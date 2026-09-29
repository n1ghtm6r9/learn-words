import { useLayoutEffect, useState, type RefObject } from 'react';

interface RowOverflow {
  overflowing: boolean;
  limit: number;
}

const DESKTOP_QUERY = '(min-width: 768px)';

interface VisibleRows {
  phone: number;
  desktop: number;
}

function pickRows(visible: VisibleRows): number {
  const desktop = typeof window.matchMedia !== 'function' || window.matchMedia(DESKTOP_QUERY).matches;
  return desktop ? visible.desktop : visible.phone;
}

export function useRowOverflow(ref: RefObject<HTMLElement | null>, itemCount: number, visible: VisibleRows): RowOverflow {
  const [state, setState] = useState<RowOverflow>({ overflowing: false, limit: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const first = element.firstElementChild as HTMLElement | null;
      if (!first) return;
      const rows = pickRows(visible);
      const gap = parseFloat(getComputedStyle(element).rowGap) || 0;
      const limit = Math.round(first.offsetHeight * rows + gap * (rows - 1));
      const overflowing = element.scrollHeight > limit + 1;
      setState((previous) =>
        previous.overflowing === overflowing && previous.limit === limit ? previous : { overflowing, limit },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, itemCount, visible]);

  return state;
}
