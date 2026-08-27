import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/useTranslation';

interface DeleteWordButtonProps {
  onDelete: () => void;
}

export function DeleteWordButton({ onDelete }: DeleteWordButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const t = useTranslation();

  if (confirming) {
    return (
      <span className="flex shrink-0 items-center gap-1.5">
        <span role="alert" className="sr-only">
          {t.confirmDelete}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
          {t.cancel}
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={onDelete} autoFocus>
          {t.delete}
        </Button>
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={t.delete}
      onClick={() => setConfirming(true)}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-[18px] w-[18px]" />
    </button>
  );
}
