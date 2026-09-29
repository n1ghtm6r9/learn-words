import { BOT_TEXTS } from './botTexts';
import type { Env } from './env.type';
import { menuKeyboard } from './menuKeyboard';
import { callTelegram } from './telegram/callTelegram';
import type { TelegramMessage } from './telegram/telegramMessage.type';

export async function sendMenu(env: Env, chatId: number): Promise<void> {
  const previousMenuId = await env.MENUS.get(String(chatId));
  const message = await callTelegram<TelegramMessage>(env.BOT_TOKEN, 'sendMessage', {
    chat_id: chatId,
    text: BOT_TEXTS.menu,
    reply_markup: menuKeyboard(env.APP_URL),
  });
  await env.MENUS.put(String(chatId), String(message.message_id));
  if (previousMenuId === null) return;
  await callTelegram(env.BOT_TOKEN, 'deleteMessage', { chat_id: chatId, message_id: Number(previousMenuId) }).catch(
    (error: unknown) => console.error(error),
  );
}
