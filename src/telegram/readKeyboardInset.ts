import { isPhoneViewport } from '@/lib/isPhoneViewport';
import { opensKeyboard } from '@/lib/opensKeyboard';
import { useTelegramStore } from './useTelegramStore';

const KEYBOARD_MIN_HEIGHT_PX = 120;

export function readKeyboardInset(): number {
  const webApp = useTelegramStore.getState().webApp;
  if (!webApp || !isPhoneViewport() || !opensKeyboard(document.activeElement)) return 0;
  const inset = Math.round(window.innerHeight - webApp.viewportHeight);
  return inset >= KEYBOARD_MIN_HEIGHT_PX ? inset : 0;
}
