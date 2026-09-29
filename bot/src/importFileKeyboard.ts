import { appLink } from './appLink';
import { BOT_TEXTS } from './botTexts';
import { singleButtonKeyboard } from './singleButtonKeyboard';
import type { InlineKeyboardMarkup } from './telegram/inlineKeyboardMarkup.type';

export function importFileKeyboard(appUrl: string, ticket: string): InlineKeyboardMarkup {
  return singleButtonKeyboard(BOT_TEXTS.importThisFile, appLink(appUrl, { tg: 'import', file: ticket }));
}
