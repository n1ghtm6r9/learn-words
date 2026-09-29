import { jsonResponse } from './jsonResponse';

export async function runSafely(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: 'telegram_failed' }, 502);
  }
}
