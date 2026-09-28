import { afterEach, describe, expect, it } from 'vitest';
import { isTelegramLaunch } from './isTelegramLaunch';

describe('isTelegramLaunch', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    window.sessionStorage.clear();
  });

  it('is false in a plain browser tab', () => {
    expect(isTelegramLaunch()).toBe(false);
  });

  it('recognises the launch parameters Telegram puts in the hash', () => {
    window.history.replaceState(null, '', '/#tgWebAppData=x&tgWebAppVersion=8.0&tgWebAppPlatform=ios');

    expect(isTelegramLaunch()).toBe(true);
  });

  it('still recognises Telegram after a reload that lost the hash', () => {
    window.sessionStorage.setItem('__telegram__initParams', JSON.stringify({ tgWebAppPlatform: 'macos' }));

    expect(isTelegramLaunch()).toBe(true);
  });
});
