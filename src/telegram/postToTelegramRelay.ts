import { TELEGRAM_RELAY_URL } from './telegramRelayUrl';
import { useTelegramStore } from './useTelegramStore';

export async function postToTelegramRelay(path: string, body: Record<string, string>): Promise<Response> {
  const initData = useTelegramStore.getState().webApp?.initData ?? '';
  const response = await fetch(`${TELEGRAM_RELAY_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, ...body }),
  });
  if (!response.ok) throw new Error(`Telegram relay answered ${response.status}`);
  return response;
}
