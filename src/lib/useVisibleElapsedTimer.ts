import { useCallback, useEffect, useRef } from 'react';

function currentlyHiddenAt(): number | null {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden' ? performance.now() : null;
}

export function useVisibleElapsedTimer() {
  const startRef = useRef(performance.now());
  const hiddenAtRef = useRef<number | null>(currentlyHiddenAt());

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = performance.now();
        return;
      }
      if (hiddenAtRef.current !== null) {
        startRef.current += performance.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const elapsedMs = useCallback(() => {
    const measuredUntil = hiddenAtRef.current ?? performance.now();
    return measuredUntil - startRef.current;
  }, []);

  const restart = useCallback(() => {
    startRef.current = performance.now();
    hiddenAtRef.current = currentlyHiddenAt();
  }, []);

  return { elapsedMs, restart };
}
