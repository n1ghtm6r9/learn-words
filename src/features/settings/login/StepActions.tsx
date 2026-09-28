import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepActionsProps {
  submitLabel: string;
  busy: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  destructive?: boolean;
}

export function StepActions({ submitLabel, busy, cancelLabel, onCancel, destructive = false }: StepActionsProps) {
  return (
    <div className="flex gap-2">
      {cancelLabel && (
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" variant={destructive ? 'destructive' : 'default'} className="flex-1" disabled={busy}>
        {busy && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {submitLabel}
      </Button>
    </div>
  );
}
