import { appLink } from './appLink';
import { BOT_TEXTS } from './botTexts';
import { commandOf } from './commandOf';
import type { Env } from './env.type';
import { offerImport } from './offerImport';
import { sendMenu } from './sendMenu';
import { singleButtonKeyboard } from './singleButtonKeyboard';
import { callTelegram } from './telegram/callTelegram';
import type { TelegramUpdate } from './telegram/telegramUpdate.type';

export async function handleUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  const message = update.message;
  if (!message || message.chat.type !== 'private') return;
  if (message.document) return offerImport(env, message, message.document);

  const chatId = message.chat.id;
  const command = commandOf(message.text);
  if (command === 'export') {
    await callTelegram(env.BOT_TOKEN, 'sendMessage', {
      chat_id: chatId,
      text: BOT_TEXTS.exportPrompt,
      reply_markup: singleButtonKeyboard(BOT_TEXTS.menuExport, appLink(env.APP_URL, { tg: 'export' })),
    });
    return;
  }
  if (command === 'import') {
    await callTelegram(env.BOT_TOKEN, 'sendMessage', {
      chat_id: chatId,
      text: BOT_TEXTS.importPrompt,
      reply_markup: singleButtonKeyboard(BOT_TEXTS.importPickFile, appLink(env.APP_URL, { tg: 'import' })),
    });
    return;
  }
  if (command === 'start' || command === 'menu') await sendMenu(env, chatId);
}
