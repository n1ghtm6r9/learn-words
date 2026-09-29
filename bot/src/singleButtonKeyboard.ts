import type { InlineKeyboardMarkup } from './telegram/inlineKeyboardMarkup.type';
import { webAppButton } from './webAppButton';

export function singleButtonKeyboard(text: string, url: string): InlineKeyboardMarkup {
  return { inline_keyboard: [[webAppButton(text, url)]] };
}
