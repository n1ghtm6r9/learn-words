import { useKeyboardStore } from '@/store/useKeyboardStore';
import type { TelegramWebApp } from '@/telegram/telegramWebApp.type';
import { isPhoneViewport } from './isPhoneViewport';
import { KEYBOARD_INSET_EVENT } from './keyboardInsetEvent';
import { KEYBOARD_MIN_HEIGHT_PX } from './keyboardMinHeight';
import { opensKeyboard } from './opensKeyboard';

const TAP_SLOP_PX = 10;
const EXPECTED_KEYBOARD_MS = 1200;

export function followKeyboard(webApp: TelegramWebApp | null): () => void {
  const root = document.documentElement;
  let windowWidth = window.innerWidth;
  let fullHeight = window.innerHeight;
  let appliedInset = 0;
  let expecting = false;
  let expectTimer: ReturnType<typeof setTimeout> | undefined;
  let touch: { target: EventTarget | null; x: number; y: number } = { target: null, x: 0, y: 0 };

  const reportedInset = () => {
    if (!webApp || !opensKeyboard(document.activeElement)) return 0;
    const inset = Math.round(window.innerHeight - webApp.viewportHeight);
    return inset >= KEYBOARD_MIN_HEIGHT_PX ? inset : 0;
  };

  const update = () => {
    const phone = isPhoneViewport();
    const inset = phone ? reportedInset() : 0;
    if (inset !== appliedInset) {
      appliedInset = inset;
      root.style.setProperty('--keyboard-inset', `${inset}px`);
      window.dispatchEvent(new Event(KEYBOARD_INSET_EVENT));
    }
    const shrunk = webApp !== null && fullHeight - window.innerHeight >= KEYBOARD_MIN_HEIGHT_PX;
    const onScreen = phone && (inset > 0 || shrunk);
    const expected = phone && expecting;
    const state = useKeyboardStore.getState();
    if (state.onScreen !== onScreen || state.expected !== expected) useKeyboardStore.setState({ onScreen, expected });
  };

  const stopExpecting = () => {
    clearTimeout(expectTimer);
    expecting = false;
  };

  const expectKeyboard = () => {
    stopExpecting();
    expecting = true;
    expectTimer = setTimeout(() => {
      expecting = false;
      update();
    }, EXPECTED_KEYBOARD_MS);
  };

  const touchPoint = (event: TouchEvent) => event.changedTouches?.[0] ?? event.touches?.[0];

  const onTouchStart = (event: TouchEvent) => {
    const point = touchPoint(event);
    touch = { target: event.target, x: point?.clientX ?? 0, y: point?.clientY ?? 0 };
  };

  const onTouchEnd = (event: TouchEvent) => {
    const point = touchPoint(event);
    const moved = point ? Math.hypot(point.clientX - touch.x, point.clientY - touch.y) > TAP_SLOP_PX : false;
    const field = event.target;
    if (moved || field !== touch.target || field === document.activeElement || !opensKeyboard(field)) return;
    expectKeyboard();
    update();
  };

  const onResize = () => {
    if (window.innerWidth !== windowWidth) {
      windowWidth = window.innerWidth;
      fullHeight = window.innerHeight;
    } else {
      fullHeight = Math.max(fullHeight, window.innerHeight);
    }
    update();
  };

  const onFocusOut = (event: FocusEvent) => {
    if (!opensKeyboard(event.relatedTarget)) stopExpecting();
    queueMicrotask(update);
  };

  const touchOptions = { capture: true, passive: true };
  webApp?.onEvent('viewportChanged', update);
  window.addEventListener('resize', onResize);
  document.addEventListener('touchstart', onTouchStart, touchOptions);
  document.addEventListener('touchend', onTouchEnd, touchOptions);
  document.addEventListener('focusin', update);
  document.addEventListener('focusout', onFocusOut);
  update();

  return () => {
    stopExpecting();
    webApp?.offEvent('viewportChanged', update);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('touchstart', onTouchStart, touchOptions);
    document.removeEventListener('touchend', onTouchEnd, touchOptions);
    document.removeEventListener('focusin', update);
    document.removeEventListener('focusout', onFocusOut);
  };
}
