import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Undo2 } from 'lucide-react';
import type { UndoToastState } from './undoToastState.type';

const VISIBLE_MS = 5000;

interface UndoToastProps {
  toast: UndoToastState | null;
  undoLabel: string;
  lifted: boolean;
  onDismiss: () => void;
}

export function UndoToast({ toast, undoLabel, lifted, onDismiss }: UndoToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      aria-live="polite"
      className={
        'pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-md px-3 transition-[bottom] duration-200 ' +
        (lifted ? 'bottom-[calc(11rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(9.5rem+env(safe-area-inset-bottom))]')
      }
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            className="pointer-events-auto flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-xl"
          >
            <span className="min-w-0 flex-1">{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={() => {
                  toast.undo?.();
                  onDismiss();
                }}
                className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-semibold text-background transition-colors hover:bg-background/15"
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                {undoLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
