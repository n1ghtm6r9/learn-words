import { postToTelegramRelay } from './postToTelegramRelay';

export async function sendFileToTelegramChat(fileName: string, content: string): Promise<void> {
  await postToTelegramRelay('/export', { fileName, content });
}
