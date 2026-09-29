import { AnimatePresence, motion } from 'motion/react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SheetOptionCoverage } from './sheetOptionCoverage.type';

interface SheetOptionProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  coverage?: SheetOptionCoverage;
  disabled?: boolean;
  onClick: () => void;
}

export function SheetOption({ icon, label, hint, coverage = 'none', disabled = false, onClick }: SheetOptionProps) {
  const Indicator = coverage === 'some' ? Minus : Check;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-14 w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-base md:min-h-11 md:rounded-xl md:py-2 md:text-sm transition-[background-color,transform] duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        disabled ? 'cursor-default' : 'hover:bg-secondary active:scale-[0.98] active:bg-secondary/80',
      )}
    >
      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center', disabled && 'opacity-60')}>{icon}</span>
      <span className={cn('min-w-0 flex-1 truncate font-medium', disabled && 'text-muted-foreground')}>{label}</span>
      {hint && <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{hint}</span>}
      <AnimatePresence initial={false}>
        {coverage !== 'none' && (
          <motion.span
            key={coverage}
            aria-hidden="true"
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 16 }}
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
              coverage === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
            )}
          >
            <Indicator className="h-3.5 w-3.5" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
