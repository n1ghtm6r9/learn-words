import { paintTelegramChrome } from './paintTelegramChrome';
import type { TelegramWebApp } from './telegramWebApp.type';

export function keepTelegramChromeInTheme(webApp: TelegramWebApp): void {
  paintTelegramChrome(webApp);
  new MutationObserver(() => paintTelegramChrome(webApp)).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}
