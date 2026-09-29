import { appLink } from './appLink';
import { BOT_TEXTS } from './botTexts';
import type { InlineKeyboardMarkup } from './telegram/inlineKeyboardMarkup.type';
import { webAppButton } from './webAppButton';

export function menuKeyboard(appUrl: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        webAppButton(BOT_TEXTS.menuExport, appLink(appUrl, { tg: 'export' })),
        webAppButton(BOT_TEXTS.menuImport, appLink(appUrl, { tg: 'import' })),
      ],
      [webAppButton(BOT_TEXTS.menuOpen, appUrl)],
    ],
  };
}
