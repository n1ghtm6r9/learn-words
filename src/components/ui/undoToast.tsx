import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Undo2 } from 'lucide-react';
import { useGlideOnViewportResize } from '@/components/layout/useGlideOnViewportResize';
import type { UndoToastState } from './undoToastState.type';

const VISIBLE_MS = 5000;

interface UndoToastProps {
  toast: UndoToastState | null;
  undoLabel: string;
  lifted: boolean;
  onDismiss: () => void;
}

export function UndoToast({ toast, undoLabel, lifted, onDismiss }: UndoToastProps) {
  const regionRef = useGlideOnViewportResize<HTMLDivElement>();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      ref={regionRef}
      aria-live="polite"
      className={
        'pointer-events-none fixed inset-x-0 md:left-60 z-40 mx-auto w-full max-w-md px-3 transition-[bottom] duration-200 ' +
        (lifted ? 'bottom-[calc(11rem+var(--safe-bottom)+var(--keyboard-inset))] md:bottom-28' : 'bottom-[calc(9.5rem+var(--safe-bottom)+var(--keyboard-inset))] md:bottom-8')
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
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-foreground px-4 py-3.5 text-[15px] text-background shadow-xl"
          >
            <span className="min-w-0 flex-1">{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={() => {
                  toast.undo?.();
                  onDismiss();
                }}
                className="flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 font-semibold text-background transition-colors hover:bg-background/15"
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
