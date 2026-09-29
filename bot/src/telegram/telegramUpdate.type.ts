import type { TelegramMessage } from './telegramMessage.type';

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}
