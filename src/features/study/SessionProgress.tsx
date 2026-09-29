import { useTranslation } from '@/i18n/useTranslation';
import { ProgressBar } from './ProgressBar';

interface SessionProgressProps {
  done: number;
  total: number;
  label: string;
  note?: string;
}

export function SessionProgress({ done, total, label, note }: SessionProgressProps) {
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium tabular-nums">{label}</span>
        {note && <span className="text-muted-foreground">{note}</span>}
      </div>
      <ProgressBar value={done} max={total} label={t.sessionProgressLabel} valueText={label} />
    </div>
  );
}
