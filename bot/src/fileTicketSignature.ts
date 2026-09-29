import { hmacSha256 } from './hmacSha256';
import { toBase64Url } from './toBase64Url';

const SIGNATURE_LENGTH = 22;

export async function fileTicketSignature(fileId: string, userId: number, botToken: string): Promise<string> {
  const signature = await hmacSha256(botToken, `learn-words-file:${userId}:${fileId}`);
  return toBase64Url(signature).slice(0, SIGNATURE_LENGTH);
}
