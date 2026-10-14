import { releaseAudioContext } from '@/lib/releaseAudioContext';
import type { TelegramWebApp } from './telegramWebApp.type';

export function releaseSoundsOnDeactivation(webApp: TelegramWebApp): void {
  webApp.onEvent('deactivated', releaseAudioContext);
}
