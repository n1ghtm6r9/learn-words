import { useEffect, useRef, useState } from 'react';
import { clamp } from '@/lib/clamp';

export function useNumberField(
  storedValue: number,
  store: (value: number) => void,
  min: number,
  max: number,
) {
  const [draft, setDraft] = useState(String(storedValue));

  function resolve(): number {
    const trimmed = draft.trim();
    const parsed = Number(trimmed);
    return trimmed !== '' && Number.isFinite(parsed) ? clamp(Math.round(parsed), min, max) : storedValue;
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
