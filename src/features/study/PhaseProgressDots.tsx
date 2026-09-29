import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';

interface PhaseProgressDotsProps {
  current: number;
  total: number;
}

export function PhaseProgressDots({ current, total }: PhaseProgressDotsProps) {
  const t = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <span className="sr-only">{t.phaseProgress(current, total)}</span>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn('h-2 flex-1 rounded-full transition-colors', i < current ? 'bg-primary' : 'bg-border')}
        />
      ))}
    </div>
  );
}
