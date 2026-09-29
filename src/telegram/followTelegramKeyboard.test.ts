import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { followTelegramKeyboard } from './followTelegramKeyboard';
import { KEYBOARD_INSET_EVENT } from './keyboardInsetEvent';
import { createFakeWebApp } from './testing/createFakeWebApp';
import { useTelegramStore } from './useTelegramStore';

const WINDOW_HEIGHT = 844;
const KEYBOARD_HEIGHT = 336;

function phoneViewport(): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }),
  });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: WINDOW_HEIGHT });
}

const inset = () => document.documentElement.style.getPropertyValue('--keyboard-inset');
const flushFocus = () => Promise.resolve();

describe('followTelegramKeyboard', () => {
  let field: HTMLInputElement;

  beforeEach(() => {
    phoneViewport();
    field = document.body.appendChild(document.createElement('input'));
  });

  afterEach(() => {
    field.remove();
    document.documentElement.style.removeProperty('--keyboard-inset');
    useTelegramStore.setState({ webApp: null });
  });

  function start() {
    const { fake: base, webApp } = createFakeWebApp();
    const fake = Object.assign(base, { viewportHeight: WINDOW_HEIGHT });
    useTelegramStore.setState({ webApp });
    followTelegramKeyboard(webApp);
    return fake;
  }

  it('lifts the bottom bar as soon as Telegram reports a keyboard over a focused field', async () => {
    const fake = start();
    const changed = vi.fn();
    window.addEventListener(KEYBOARD_INSET_EVENT, changed);
    field.focus();
    await flushFocus();

    fake.viewportHeight = WINDOW_HEIGHT - KEYBOARD_HEIGHT;
    fake.emit('viewportChanged');

    expect(inset()).toBe(`${KEYBOARD_HEIGHT}px`);
    expect(changed).toHaveBeenCalledTimes(1);
    window.removeEventListener(KEYBOARD_INSET_EVENT, changed);
  });

  it('drops the lift once Telegram shrinks the window to the same height', async () => {
    const fake = start();
    field.focus();
    await flushFocus();
    fake.viewportHeight = WINDOW_HEIGHT - KEYBOARD_HEIGHT;
    fake.emit('viewportChanged');

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: WINDOW_HEIGHT - KEYBOARD_HEIGHT });
    window.dispatchEvent(new Event('resize'));

    expect(inset()).toBe('0px');
  });

  it('ignores a smaller viewport while nothing is being typed', () => {
    const fake = start();

    fake.viewportHeight = WINDOW_HEIGHT - KEYBOARD_HEIGHT;
    fake.emit('viewportChanged');

    expect(inset()).toBe('');
  });

  it('drops the lift when the field loses focus', async () => {
    const fake = start();
    field.focus();
    await flushFocus();
    fake.viewportHeight = WINDOW_HEIGHT - KEYBOARD_HEIGHT;
    fake.emit('viewportChanged');

    field.blur();
    await flushFocus();

    expect(inset()).toBe('0px');
  });
});
