import { lazy, Suspense, useState } from 'react';
import { loadExportDialog } from './loadExportDialog';

const ExportDialog = lazy(loadExportDialog);

interface LazyExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSentToChat?: () => void;
}

export function LazyExportDialog({ open, onOpenChange, onSentToChat }: LazyExportDialogProps) {
  const [requested, setRequested] = useState(open);
  if (open && !requested) setRequested(true);
  if (!requested) return null;

  return (
    <Suspense fallback={null}>
      <ExportDialog open={open} onOpenChange={onOpenChange} onSentToChat={onSentToChat} />
    </Suspense>
  );
}
