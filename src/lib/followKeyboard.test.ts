import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useKeyboardStore } from '@/store/useKeyboardStore';
import { createFakeWebApp } from '@/telegram/testing/createFakeWebApp';
import { followKeyboard } from './followKeyboard';
import { KEYBOARD_INSET_EVENT } from './keyboardInsetEvent';

const WINDOW_HEIGHT = 844;
const KEYBOARD_HEIGHT = 336;

function setWindowHeight(height: number): void {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

function phoneViewport(): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }),
  });
  setWindowHeight(WINDOW_HEIGHT);
}

const inset = () => Number.parseFloat(document.documentElement.style.getPropertyValue('--keyboard-inset') || '0');
const keyboardOnScreen = () => useKeyboardStore.getState().onScreen;
const keyboardExpected = () => useKeyboardStore.getState().expected;
const flushFocus = () => Promise.resolve();

function tap(element: HTMLElement): void {
  element.dispatchEvent(new Event('touchstart', { bubbles: true }));
  element.dispatchEvent(new Event('touchend', { bubbles: true }));
}

describe('followKeyboard', () => {
  let field: HTMLInputElement;
  let stop: (() => void) | undefined;

  beforeEach(() => {
    phoneViewport();
    field = document.body.appendChild(document.createElement('input'));
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    field.remove();
    document.documentElement.style.removeProperty('--keyboard-inset');
    useKeyboardStore.setState({ expected: false, onScreen: false });
    vi.useRealTimers();
  });

  function startInTelegram() {
    const { fake: base, webApp } = createFakeWebApp();
    const fake = Object.assign(base, { viewportHeight: WINDOW_HEIGHT });
    stop = followKeyboard(webApp);
    return fake;
  }

  it('expects a keyboard the moment a field is tapped', () => {
    stop = followKeyboard(null);

    tap(field);

    expect(keyboardExpected()).toBe(true);
    expect(keyboardOnScreen()).toBe(false);
  });

  it('does not expect a keyboard when a field gets focus without a tap', async () => {
    stop = followKeyboard(null);

    field.focus();
    await flushFocus();

    expect(keyboardExpected()).toBe(false);
  });

  it('gives up on the keyboard when none shows up after a tap', () => {
    vi.useFakeTimers();
    stop = followKeyboard(null);
    tap(field);

    vi.advanceTimersByTime(1500);

    expect(keyboardExpected()).toBe(false);
  });

  it('keeps the keyboard open while Telegram reports it over a focused field', async () => {
    vi.useFakeTimers();
    const fake = startInTelegram();
    const changed = vi.fn();
    window.addEventListener(KEYBOARD_INSET_EVENT, changed);
    field.focus();
    await flushFocus();

    fake.viewportHeight = WINDOW_HEIGHT - KEYBOARD_HEIGHT;
    fake.emit('viewportChanged');
    vi.advanceTimersByTime(1500);

    expect(inset()).toBe(KEYBOARD_HEIGHT);
    expect(keyboardOnScreen()).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    window.removeEventListener(KEYBOARD_INSET_EVENT, changed);
  });

  it('stays open after Telegram shrinks the window and closes once it grows back', async () => {
    const fake = startInTelegram();
    field.focus();
    await flushFocus();
    fake.viewportHeight = WINDOW_HEIGHT - KEYBOARD_HEIGHT;
    fake.emit('viewportChanged');

    setWindowHeight(WINDOW_HEIGHT - KEYBOARD_HEIGHT);
    window.dispatchEvent(new Event('resize'));
    field.blur();
    await flushFocus();

    expect(inset()).toBe(0);
    expect(keyboardOnScreen()).toBe(true);

    setWindowHeight(WINDOW_HEIGHT);
    fake.viewportHeight = WINDOW_HEIGHT;
    window.dispatchEvent(new Event('resize'));

    expect(keyboardOnScreen()).toBe(false);
  });

  it('ignores a smaller Telegram viewport while nothing is being typed', () => {
    const fake = startInTelegram();

    fake.viewportHeight = WINDOW_HEIGHT - KEYBOARD_HEIGHT;
    fake.emit('viewportChanged');

    expect(inset()).toBe(0);
    expect(keyboardOnScreen()).toBe(false);
  });
});
