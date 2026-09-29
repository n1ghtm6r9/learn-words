import { KEYBOARD_INSET_EVENT } from './keyboardInsetEvent';
import { readKeyboardInset } from './readKeyboardInset';
import type { TelegramWebApp } from './telegramWebApp.type';

export function followTelegramKeyboard(webApp: TelegramWebApp): void {
  let applied = 0;

  const apply = () => {
    const inset = readKeyboardInset();
    if (inset === applied) return;
    applied = inset;
    document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`);
    window.dispatchEvent(new Event(KEYBOARD_INSET_EVENT));
  };
  const applyOnceFocusSettles = () => queueMicrotask(apply);

  webApp.onEvent('viewportChanged', apply);
  window.addEventListener('resize', apply);
  document.addEventListener('focusin', applyOnceFocusSettles);
  document.addEventListener('focusout', applyOnceFocusSettles);
}
