import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadTelegramWebApp } from './loadTelegramWebApp';

describe('loadTelegramWebApp', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    vi.restoreAllMocks();
  });

  it('does not load the Telegram SDK outside Telegram', async () => {
    await expect(loadTelegramWebApp()).resolves.toBeNull();
    expect('Telegram' in window).toBe(false);
  });

  it('hands back the Telegram WebApp when launched from Telegram', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    window.history.replaceState(null, '', '/#tgWebAppVersion=8.0&tgWebAppPlatform=ios');

    const webApp = await loadTelegramWebApp();

    expect(webApp?.platform).toBe('ios');
    expect(typeof webApp?.ready).toBe('function');
  });
});
