import { cssColorToHex } from '@/lib/cssColorToHex';
import type { TelegramWebApp } from './telegramWebApp.type';

const FALLBACK_BACKGROUND = '#f7f5ee';

export function paintTelegramChrome(webApp: TelegramWebApp): void {
  const computed = getComputedStyle(document.documentElement);
  const background = cssColorToHex(computed.getPropertyValue('--background'), FALLBACK_BACKGROUND) as `#${string}`;
  const card = cssColorToHex(computed.getPropertyValue('--card'), background);
  webApp.setHeaderColor(background);
  webApp.setBackgroundColor(background);
  webApp.setBottomBarColor(card);
}
