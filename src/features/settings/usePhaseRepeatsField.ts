import { useEffect, useRef, useState } from 'react';
import { clamp } from '@/lib/clamp';
import { MIN_PHASE_REPEATS, MAX_PHASE_REPEATS } from '@/lib/phaseRepeatsRange';

export function usePhaseRepeatsField(storedValue: number, store: (value: number) => void) {
  const [draft, setDraft] = useState(String(storedValue));

  function resolve(): number {
    const trimmed = draft.trim();
    const parsed = Number(trimmed);
    return trimmed !== '' && Number.isFinite(parsed)
      ? clamp(Math.round(parsed), MIN_PHASE_REPEATS, MAX_PHASE_REPEATS)
      : storedValue;
  }

  const flushRef = useRef<() => void>(() => {});
  flushRef.current = () => store(resolve());

  useEffect(() => () => flushRef.current(), []);

  function commit() {
    const value = resolve();
    store(value);
    setDraft(String(value));
  }

  return { draft, setDraft, commit };
}
