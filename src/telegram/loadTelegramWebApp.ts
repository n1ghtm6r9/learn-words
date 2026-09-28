import { isTelegramLaunch } from './isTelegramLaunch';
import type { TelegramWebApp } from './telegramWebApp.type';
import type { TelegramWindow } from './telegramWindow.type';

export async function loadTelegramWebApp(): Promise<TelegramWebApp | null> {
  if (!isTelegramLaunch()) return null;
  try {
    await import('@twa-dev/sdk');
    return (window as TelegramWindow).Telegram?.WebApp ?? null;
  } catch {
    return null;
  }
}
