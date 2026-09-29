import { useEffect, useState } from 'react';
import { KEYBOARD_INSET_EVENT } from '@/telegram/keyboardInsetEvent';
import { readKeyboardInset } from '@/telegram/readKeyboardInset';
import { isPhoneViewport } from './isPhoneViewport';
import { opensKeyboard } from './opensKeyboard';

const KEYBOARD_MIN_HEIGHT_PX = 120;

export function useKeyboardOpenOnPhone(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    let width = window.innerWidth;
    let fullHeight = window.innerHeight;

    const sync = () => {
      if (window.innerWidth !== width) {
        width = window.innerWidth;
        fullHeight = window.innerHeight;
      }
      fullHeight = Math.max(fullHeight, window.innerHeight);
      const typing = isPhoneViewport() && opensKeyboard(document.activeElement);
      const windowShrunk = fullHeight - window.innerHeight >= KEYBOARD_MIN_HEIGHT_PX;
      const viewportCovered = viewport ? window.innerHeight - viewport.height >= KEYBOARD_MIN_HEIGHT_PX : false;
      setOpen(typing && (readKeyboardInset() > 0 || windowShrunk || viewportCovered));
    };
    const syncOnceFocusSettles = () => queueMicrotask(sync);

    document.addEventListener('focusin', syncOnceFocusSettles);
    document.addEventListener('focusout', syncOnceFocusSettles);
    window.addEventListener('resize', sync);
    window.addEventListener(KEYBOARD_INSET_EVENT, sync);
    viewport?.addEventListener('resize', sync);
    sync();
    return () => {
      document.removeEventListener('focusin', syncOnceFocusSettles);
      document.removeEventListener('focusout', syncOnceFocusSettles);
      window.removeEventListener('resize', sync);
      window.removeEventListener(KEYBOARD_INSET_EVENT, sync);
      viewport?.removeEventListener('resize', sync);
    };
  }, []);

  return open;
}
