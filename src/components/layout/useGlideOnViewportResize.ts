import { useEffect, useRef } from 'react';
import { isPhoneViewport } from '@/lib/isPhoneViewport';
import { readTranslateY } from '@/lib/readTranslateY';

const GLIDE_DURATION_MS = 280;
const GLIDE_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export function useGlideOnViewportResize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    let glide: Animation | undefined;

    const stopGlide = (element: T): number => {
      if (!glide) return 0;
      const unfinished = readTranslateY(element);
      glide.cancel();
      glide = undefined;
      return unfinished;
    };

    const onResize = () => {
      const element = ref.current;
      const shift = lastHeight - window.innerHeight;
      const rotated = lastWidth !== window.innerWidth;
      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
      if (!element || typeof element.animate !== 'function') return;
      const unfinished = stopGlide(element);
      if (shift === 0 || rotated || !isPhoneViewport()) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      glide = element.animate([{ translate: `0 ${shift + unfinished}px` }, { translate: '0 0' }], {
        duration: GLIDE_DURATION_MS,
        easing: GLIDE_EASING,
      });
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      glide?.cancel();
    };
  }, []);

  return ref;
}
