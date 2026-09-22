import { motion } from 'motion/react';
import { FolderInput, Hash, Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';

interface SelectionActionBarProps {
  disabled: boolean;
  onMove: () => void;
  onAddTag: () => void;
  onRemoveTag: () => void;
  onDelete: () => void;
}

function TagActionIcon({ sign }: { sign: 'plus' | 'minus' }) {
  const Sign = sign === 'plus' ? Plus : Minus;
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      <Hash className="h-5 w-5" aria-hidden="true" />
      <span className="absolute -right-1.5 -bottom-1 flex h-3 w-3 items-center justify-center rounded-full bg-current">
        <Sign className="h-2.5 w-2.5 text-card" strokeWidth={3.5} aria-hidden="true" />
      </span>
    </span>
  );
}

export function SelectionActionBar({ disabled, onMove, onAddTag, onRemoveTag, onDelete }: SelectionActionBarProps) {
  const t = useTranslation();

  const actions = [
    { key: 'move', label: t.actionToFolder, icon: <FolderInput className="h-5 w-5" aria-hidden="true" />, onClick: onMove },
    { key: 'add', label: t.actionAddTag, icon: <TagActionIcon sign="plus" />, onClick: onAddTag },
    { key: 'remove', label: t.actionRemoveTag, icon: <TagActionIcon sign="minus" />, onClick: onRemoveTag },
    {
      key: 'delete',
      label: t.actionDelete,
      icon: <Trash2 className="h-5 w-5" aria-hidden="true" />,
      onClick: onDelete,
      danger: true,
    },
  ];

  return (
    <motion.div
      role="toolbar"
      aria-label={t.selectWords}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
      className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-md px-3"
    >
      <div className="grid grid-cols-4 gap-1 rounded-2xl border border-border/80 bg-card/95 p-1.5 shadow-xl backdrop-blur">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            disabled={disabled}
            onClick={action.onClick}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] leading-tight font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              action.danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-secondary',
              disabled && 'pointer-events-none opacity-35',
            )}
          >
            {action.icon}
            <span className="text-center">{action.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
