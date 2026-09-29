import { lazy, Suspense, useState } from 'react';
import { loadExportDialog } from './loadExportDialog';

const ExportDialog = lazy(loadExportDialog);

interface LazyExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LazyExportDialog({ open, onOpenChange }: LazyExportDialogProps) {
  const [requested, setRequested] = useState(open);
  if (open && !requested) setRequested(true);
  if (!requested) return null;

  return (
    <Suspense fallback={null}>
      <ExportDialog open={open} onOpenChange={onOpenChange} />
    </Suspense>
  );
}
