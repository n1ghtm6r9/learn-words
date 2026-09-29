import { cn } from '@/lib/utils';

interface SheetOptionProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function SheetOption({ icon, label, hint, disabled = false, onClick }: SheetOptionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-14 w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-base md:min-h-11 md:rounded-xl md:py-2 md:text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        disabled ? 'cursor-default opacity-45' : 'hover:bg-secondary active:bg-secondary/80',
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      {hint && <span className="shrink-0 font-mono text-xs text-muted-foreground">{hint}</span>}
    </button>
  );
}
