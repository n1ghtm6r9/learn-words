import { BOT_TEXTS } from './botTexts';
import type { Env } from './env.type';
import { importFileKeyboard } from './importFileKeyboard';
import { signFileTicket } from './signFileTicket';
import { callTelegram } from './telegram/callTelegram';
import type { TelegramMessage } from './telegram/telegramMessage.type';

export async function sendExportToChat(env: Env, userId: number, fileName: string, content: string): Promise<void> {
  const form = new FormData();
  form.set('chat_id', String(userId));
  form.set('caption', BOT_TEXTS.exportCaption);
  form.set('document', new Blob([content], { type: 'application/json' }), fileName);
  const message = await callTelegram<TelegramMessage>(env.BOT_TOKEN, 'sendDocument', form);

  const fileId = message.document?.file_id;
  if (!fileId) return;
  const ticket = await signFileTicket(fileId, userId, env.BOT_TOKEN);
  await callTelegram(env.BOT_TOKEN, 'editMessageReplyMarkup', {
    chat_id: userId,
    message_id: message.message_id,
    reply_markup: importFileKeyboard(env.APP_URL, ticket),
  }).catch((error: unknown) => console.error(error));
}
