import type { TelegramDocument } from './telegram/telegramDocument.type';

export function isJsonDocument(document: TelegramDocument): boolean {
  return document.mime_type === 'application/json' || /\.json$/i.test(document.file_name ?? '');
}
