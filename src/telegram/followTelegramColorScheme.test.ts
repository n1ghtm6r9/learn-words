import { afterEach, describe, expect, it } from 'vitest';
import { useUIStore } from '@/store/useUIStore';
import { followTelegramColorScheme } from './followTelegramColorScheme';
import { createFakeWebApp } from './testing/createFakeWebApp';

describe('followTelegramColorScheme', () => {
  afterEach(() => {
    window.localStorage.clear();
    useUIStore.setState({ theme: 'light' });
  });

  it('takes the Telegram colour scheme while no theme was picked', () => {
    const { fake, webApp } = createFakeWebApp('dark');

    followTelegramColorScheme(webApp);
    expect(useUIStore.getState().theme).toBe('dark');

    fake.colorScheme = 'light';
    fake.emit('themeChanged');
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('keeps the theme picked in the settings', () => {
    useUIStore.getState().setTheme('light');
    const { fake, webApp } = createFakeWebApp('dark');

    followTelegramColorScheme(webApp);
    fake.emit('themeChanged');

    expect(useUIStore.getState().theme).toBe('light');
  });
});
