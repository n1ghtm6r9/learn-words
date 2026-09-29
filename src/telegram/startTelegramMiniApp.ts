import { followTelegramKeyboard } from './followTelegramKeyboard';
import { keepTelegramChromeInTheme } from './keepTelegramChromeInTheme';
import { pullCloudOnActivation } from './pullCloudOnActivation';
import type { TelegramWebApp } from './telegramWebApp.type';

export function startTelegramMiniApp(webApp: TelegramWebApp): void {
  webApp.ready();
  webApp.expand();
  webApp.disableVerticalSwipes();
  keepTelegramChromeInTheme(webApp);
  followTelegramKeyboard(webApp);
  pullCloudOnActivation(webApp);
}
