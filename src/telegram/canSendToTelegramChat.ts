import { TELEGRAM_RELAY_URL } from './telegramRelayUrl';
import { useTelegramStore } from './useTelegramStore';

export function canSendToTelegramChat(): boolean {
  const initData = useTelegramStore.getState().webApp?.initData ?? '';
  return initData !== '' && TELEGRAM_RELAY_URL !== '';
}
