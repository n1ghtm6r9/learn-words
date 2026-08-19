import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';

interface PhaseProgressDotsProps {
  current: number;
  total: number;
}

export function PhaseProgressDots({ current, total }: PhaseProgressDotsProps) {
  const t = useTranslation();

  return (
    <div className="flex items-center gap-1.5">
      <span className="sr-only">{t.phaseProgress(current, total)}</span>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn('h-1.5 rounded-full transition-colors', i < current ? 'w-5 bg-primary' : 'w-1.5 bg-border')}
        />
      ))}
    </div>
  );
}
