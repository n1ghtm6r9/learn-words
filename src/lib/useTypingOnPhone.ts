import { useEffect, useState } from 'react';
import { isPhoneViewport } from './isPhoneViewport';
import { opensKeyboard } from './opensKeyboard';

const isTypingOnPhone = () => isPhoneViewport() && opensKeyboard(document.activeElement);

export function useTypingOnPhone(): boolean {
  const [typing, setTyping] = useState(isTypingOnPhone);

  useEffect(() => {
    const sync = () => queueMicrotask(() => setTyping(isTypingOnPhone()));
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', sync);
    return () => {
      document.removeEventListener('focusin', sync);
      document.removeEventListener('focusout', sync);
    };
  }, []);

  return typing;
}
