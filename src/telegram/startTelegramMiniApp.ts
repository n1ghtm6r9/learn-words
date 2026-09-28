import { keepTelegramChromeInTheme } from './keepTelegramChromeInTheme';
import { pullCloudOnActivation } from './pullCloudOnActivation';
import type { TelegramWebApp } from './telegramWebApp.type';

export function startTelegramMiniApp(webApp: TelegramWebApp): void {
  webApp.ready();
  webApp.expand();
  webApp.disableVerticalSwipes();
  keepTelegramChromeInTheme(webApp);
  pullCloudOnActivation(webApp);
}
