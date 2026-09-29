import { lazy, Suspense, useState } from 'react';
import { loadImportDialog } from './loadImportDialog';

const ImportDialog = lazy(loadImportDialog);

interface LazyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadInitialFile?: () => Promise<File>;
}

export function LazyImportDialog({ open, onOpenChange, loadInitialFile }: LazyImportDialogProps) {
  const [requested, setRequested] = useState(open);
  if (open && !requested) setRequested(true);
  if (!requested) return null;

  return (
    <Suspense fallback={null}>
      <ImportDialog open={open} onOpenChange={onOpenChange} loadInitialFile={loadInitialFile} />
    </Suspense>
  );
}
