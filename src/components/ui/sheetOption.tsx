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
        'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        disabled ? 'cursor-default opacity-45' : 'hover:bg-secondary active:bg-secondary/80',
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      {hint && <span className="shrink-0 font-mono text-xs text-muted-foreground">{hint}</span>}
    </button>
  );
}
