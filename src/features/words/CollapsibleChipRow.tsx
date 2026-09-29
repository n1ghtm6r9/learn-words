import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { useRowOverflow } from './useRowOverflow';

const VISIBLE_ROWS = { phone: 2, desktop: 2 };

interface CollapsibleChipRowProps {
  itemCount: number;
  forceExpanded?: boolean;
  expandedClassName?: string;
  innerRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

export function CollapsibleChipRow({
  itemCount,
  forceExpanded = false,
  expandedClassName,
  innerRef,
  children,
}: CollapsibleChipRowProps) {
  const ownRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const ref = innerRef ?? ownRef;
  const [expanded, setExpanded] = useState(false);
  const [restHeight, setRestHeight] = useState<number | null>(null);
  const { overflowing, limit } = useRowOverflow(ref, itemCount, VISIBLE_ROWS);
  const t = useTranslation();
  const open = expanded || forceExpanded;
  const clipped = overflowing && !open;
  const floating = overflowing && forceExpanded;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || forceExpanded) return;
    const measure = () => setRestHeight(frame.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [forceExpanded]);

  return (
    <div ref={frameRef} className="relative" style={floating && restHeight != null ? { height: restHeight } : undefined}>
      <div
        className={cn(
          'flex items-start gap-2',
          forceExpanded && expandedClassName,
          floating && 'absolute inset-x-0 top-0',
        )}
      >
        <div
          ref={ref}
          style={clipped ? { maxHeight: limit } : undefined}
          onFocusCapture={(event) => {
            if (clipped && event.target.matches(':focus-visible')) setExpanded(true);
          }}
          className={cn('flex min-w-0 flex-1 flex-wrap gap-2', clipped && 'overflow-clip')}
        >
          {children}
        </div>
        {overflowing && !forceExpanded && (
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? t.showLessChips : t.showAllChips}
            title={open ? t.showLessChips : t.showAllChips}
            onClick={() => setExpanded(!expanded)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:h-8 md:w-8"
          >
            <ChevronDown className={cn('h-4.5 w-4.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
