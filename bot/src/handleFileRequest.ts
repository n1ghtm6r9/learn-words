import type { Env } from './env.type';
import { jsonResponse } from './jsonResponse';
import { readFileTicket } from './readFileTicket';
import { readJsonBody } from './readJsonBody';
import { downloadTelegramFile } from './telegram/downloadTelegramFile';
import { verifyInitData } from './verifyInitData';

export async function handleFileRequest(request: Request, env: Env): Promise<Response> {
  const { initData, ticket } = await readJsonBody(request);
  if (typeof initData !== 'string' || typeof ticket !== 'string') {
    return jsonResponse({ ok: false, error: 'bad_request' }, 400);
  }

  const userId = await verifyInitData(initData, env.BOT_TOKEN, Date.now());
  if (userId === null) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  const fileId = await readFileTicket(ticket, userId, env.BOT_TOKEN);
  if (fileId === null) return jsonResponse({ ok: false, error: 'forbidden' }, 403);

  return jsonResponse(await downloadTelegramFile(env.BOT_TOKEN, fileId));
}
