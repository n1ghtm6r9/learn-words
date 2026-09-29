import type { Env } from './env.type';
import { jsonResponse } from './jsonResponse';
import { MAX_TELEGRAM_DOWNLOAD_BYTES } from './maxTelegramDownloadBytes';
import { readJsonBody } from './readJsonBody';
import { safeFileName } from './safeFileName';
import { sendExportToChat } from './sendExportToChat';
import { verifyInitData } from './verifyInitData';

export async function handleExport(request: Request, env: Env): Promise<Response> {
  const { initData, fileName, content } = await readJsonBody(request);
  if (typeof initData !== 'string' || typeof fileName !== 'string' || typeof content !== 'string') {
    return jsonResponse({ ok: false, error: 'bad_request' }, 400);
  }
  if (content.length > MAX_TELEGRAM_DOWNLOAD_BYTES) return jsonResponse({ ok: false, error: 'too_large' }, 413);

  const userId = await verifyInitData(initData, env.BOT_TOKEN, Date.now());
  if (userId === null) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  await sendExportToChat(env, userId, safeFileName(fileName), content);
  return jsonResponse({ ok: true });
}
