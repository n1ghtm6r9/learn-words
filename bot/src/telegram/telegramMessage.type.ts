import type { TelegramDocument } from './telegramDocument.type';

export interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string };
  from?: { id: number };
  text?: string;
  document?: TelegramDocument;
}
