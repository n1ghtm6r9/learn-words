import { BOT_TEXTS } from './botTexts';
import type { Env } from './env.type';
import { importFileKeyboard } from './importFileKeyboard';
import { isJsonDocument } from './isJsonDocument';
import { MAX_TELEGRAM_DOWNLOAD_BYTES } from './maxTelegramDownloadBytes';
import { signFileTicket } from './signFileTicket';
import { callTelegram } from './telegram/callTelegram';
import type { TelegramDocument } from './telegram/telegramDocument.type';
import type { TelegramMessage } from './telegram/telegramMessage.type';

export async function offerImport(env: Env, message: TelegramMessage, document: TelegramDocument): Promise<void> {
  const reply = (text: string, extra: object = {}) =>
    callTelegram(env.BOT_TOKEN, 'sendMessage', {
      chat_id: message.chat.id,
      text,
      reply_parameters: { message_id: message.message_id },
      ...extra,
    });

  if (!isJsonDocument(document)) return void (await reply(BOT_TEXTS.notAnExport));
  if ((document.file_size ?? 0) > MAX_TELEGRAM_DOWNLOAD_BYTES) return void (await reply(BOT_TEXTS.tooLarge));

  const userId = message.from?.id ?? message.chat.id;
  const ticket = await signFileTicket(document.file_id, userId, env.BOT_TOKEN);
  await reply(BOT_TEXTS.importOffer(document.file_name ?? 'learn-words.json'), {
    reply_markup: importFileKeyboard(env.APP_URL, ticket),
  });
}
