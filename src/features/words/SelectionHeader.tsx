import { X } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface SelectionHeaderProps {
  count: number;
  total: number;
  onToggleAll: () => void;
  onExit: () => void;
}

export function SelectionHeader({ count, total, onToggleAll, onExit }: SelectionHeaderProps) {
  const t = useTranslation();
  const allSelected = total > 0 && count === total;

  return (
    <div className="sticky top-[61px] z-20 -mx-4 flex items-center gap-2 border-b border-border/70 bg-background/95 px-2 py-1.5 backdrop-blur">
      <button
        type="button"
        aria-label={t.exitSelection}
        onClick={onExit}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
      <p aria-live="polite" className="min-w-0 flex-1 truncate text-sm font-semibold">
        {count === 0 ? t.selectionHint : t.selectedOf(count, total)}
      </p>
      <button
        type="button"
        onClick={onToggleAll}
        className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        {allSelected ? t.deselectAll : t.selectAll}
      </button>
    </div>
  );
}
