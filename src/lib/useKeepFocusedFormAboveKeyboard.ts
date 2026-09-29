import { useEffect } from 'react';
import { isPhoneViewport } from './isPhoneViewport';
import { KEEP_ABOVE_KEYBOARD_ATTRIBUTE } from './keepAboveKeyboardAttribute';
import { KEYBOARD_INSET_EVENT } from './keyboardInsetEvent';
import { opensKeyboard } from './opensKeyboard';

export function useKeepFocusedFormAboveKeyboard(): void {
  useEffect(() => {
    let frame = 0;

    const reveal = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const field = document.activeElement;
        if (!isPhoneViewport() || !opensKeyboard(field)) return;
        const form = field?.closest(`[${KEEP_ABOVE_KEYBOARD_ATTRIBUTE}]`);
        form?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    };

    window.addEventListener('resize', reveal);
    window.addEventListener(KEYBOARD_INSET_EVENT, reveal);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', reveal);
      window.removeEventListener(KEYBOARD_INSET_EVENT, reveal);
    };
  }, []);
}
