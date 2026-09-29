import { callTelegram } from './callTelegram';

export async function downloadTelegramFile(
  botToken: string,
  fileId: string,
): Promise<{ fileName: string; content: string }> {
  const file = await callTelegram<{ file_path?: string }>(botToken, 'getFile', { file_id: fileId });
  if (!file.file_path) throw new Error('getFile: no file_path');
  const response = await fetch(`https://api.telegram.org/file/bot${botToken}/${file.file_path}`);
  if (!response.ok) throw new Error(`file download: ${response.status}`);
  return { fileName: file.file_path.split('/').pop() ?? 'learn-words.json', content: await response.text() };
}
