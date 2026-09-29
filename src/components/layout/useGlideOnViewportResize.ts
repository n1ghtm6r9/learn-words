import { useEffect, useRef } from 'react';
import { isPhoneViewport } from '@/lib/isPhoneViewport';
import { readTranslateY } from '@/lib/readTranslateY';
import { KEYBOARD_INSET_EVENT } from '@/telegram/keyboardInsetEvent';
import { readKeyboardInset } from '@/telegram/readKeyboardInset';

const GLIDE_DURATION_MS = 280;
const GLIDE_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const visibleBottom = () => window.innerHeight - readKeyboardInset();

export function useGlideOnViewportResize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    let lastWidth = window.innerWidth;
    let lastBottom = visibleBottom();
    let glide: Animation | undefined;

    const stopGlide = (element: T): number => {
      if (!glide) return 0;
      const unfinished = readTranslateY(element);
      glide.cancel();
      glide = undefined;
      return unfinished;
    };

    const onBottomMoved = () => {
      const element = ref.current;
      const bottom = visibleBottom();
      const shift = lastBottom - bottom;
      const rotated = lastWidth !== window.innerWidth;
      lastWidth = window.innerWidth;
      lastBottom = bottom;
      if (shift === 0 || !element || typeof element.animate !== 'function') return;
      const unfinished = stopGlide(element);
      if (rotated || !isPhoneViewport()) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      glide = element.animate([{ translate: `0 ${shift + unfinished}px` }, { translate: '0 0' }], {
        duration: GLIDE_DURATION_MS,
        easing: GLIDE_EASING,
      });
    };

    window.addEventListener('resize', onBottomMoved);
    window.addEventListener(KEYBOARD_INSET_EVENT, onBottomMoved);
    return () => {
      window.removeEventListener('resize', onBottomMoved);
      window.removeEventListener(KEYBOARD_INSET_EVENT, onBottomMoved);
      glide?.cancel();
    };
  }, []);

  return ref;
}
