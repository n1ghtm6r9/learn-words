import { useEffect, useRef } from 'react';

const SHAKE_KEYFRAMES = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-6px)' },
  { transform: 'translateX(5px)' },
  { transform: 'translateX(-3px)' },
  { transform: 'translateX(0)' },
];
const SHAKE_DURATION_MS = 320;

export function useShakeOnInvalid(invalid: boolean | undefined) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!invalid || !element || typeof element.animate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    element.animate(SHAKE_KEYFRAMES, { duration: SHAKE_DURATION_MS, easing: 'ease-out' });
  }, [invalid]);

  return ref;
}
