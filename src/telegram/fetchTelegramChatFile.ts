import { postToTelegramRelay } from './postToTelegramRelay';

export async function fetchTelegramChatFile(ticket: string): Promise<File> {
  const response = await postToTelegramRelay('/file', { ticket });
  const { fileName, content } = (await response.json()) as { fileName: string; content: string };
  return new File([content], fileName, { type: 'application/json' });
}
