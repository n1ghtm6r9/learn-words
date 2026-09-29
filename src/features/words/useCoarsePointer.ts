import { useSyncExternalStore } from 'react';

const QUERY = '(pointer: coarse)';

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const list = window.matchMedia(QUERY);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
