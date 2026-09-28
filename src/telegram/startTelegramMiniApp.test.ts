import { describe, expect, it, vi } from 'vitest';
import { startTelegramMiniApp } from './startTelegramMiniApp';
import { createFakeWebApp } from './testing/createFakeWebApp';

vi.mock('./keepTelegramChromeInTheme', () => ({ keepTelegramChromeInTheme: vi.fn() }));
vi.mock('./pullCloudOnActivation', () => ({ pullCloudOnActivation: vi.fn() }));

describe('startTelegramMiniApp', () => {
  it('opens full height and keeps swipes inside the app', () => {
    const { webApp } = createFakeWebApp();

    startTelegramMiniApp(webApp);

    expect(webApp.ready).toHaveBeenCalled();
    expect(webApp.expand).toHaveBeenCalled();
    expect(webApp.disableVerticalSwipes).toHaveBeenCalled();
  });
});
