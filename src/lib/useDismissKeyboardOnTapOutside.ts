import { useEffect } from 'react';
import { isPhoneViewport } from './isPhoneViewport';
import { opensKeyboard } from './opensKeyboard';

export function useDismissKeyboardOnTapOutside(): void {
  useEffect(() => {
    let focusedAtTap: Element | null = null;

    const rememberFocus = () => {
      focusedAtTap = document.activeElement;
    };

    const dismiss = (event: MouseEvent) => {
      const field = document.activeElement;
      if (!(field instanceof HTMLElement) || !isPhoneViewport() || !opensKeyboard(field) || field !== focusedAtTap) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target || opensKeyboard(target) || field.contains(target)) return;
      if (field.closest('form')?.contains(target)) return;
      field.blur();
    };

    document.addEventListener('click', rememberFocus, true);
    document.addEventListener('click', dismiss);
    return () => {
      document.removeEventListener('click', rememberFocus, true);
      document.removeEventListener('click', dismiss);
    };
  }, []);
}
