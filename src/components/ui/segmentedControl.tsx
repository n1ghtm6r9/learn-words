import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SegmentedOption<Value extends string> {
  value: Value;
  label: string;
}

interface SegmentedControlProps<Value extends string> {
  options: SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  label?: string;
  className?: string;
}

export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<Value>) {
  const thumbId = useId();

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex w-full rounded-xl bg-muted p-1 sm:w-fit sm:self-start', className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex min-h-10 flex-1 items-center justify-center rounded-lg px-4 text-[15px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 sm:flex-none md:min-h-8 md:px-3.5 md:text-sm',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {selected && (
              <motion.span
                layoutId={thumbId}
                aria-hidden="true"
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                className="absolute inset-0 rounded-lg bg-card shadow-sm ring-1 ring-border/70 dark:bg-[color-mix(in_oklch,var(--foreground)_16%,var(--muted))] dark:ring-0"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
