import type { Env } from './env.type';
import { handleUpdate } from './handleUpdate';
import type { TelegramUpdate } from './telegram/telegramUpdate.type';
import { webhookSecret } from './webhookSecret';

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (secret !== (await webhookSecret(env.BOT_TOKEN))) return new Response('Forbidden', { status: 403 });

  try {
    await handleUpdate((await request.json()) as TelegramUpdate, env);
  } catch (error) {
    console.error(error);
  }
  return new Response('ok');
}
