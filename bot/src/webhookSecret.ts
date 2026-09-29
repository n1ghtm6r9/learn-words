import { hmacSha256 } from './hmacSha256';
import { toHex } from './toHex';

export async function webhookSecret(botToken: string): Promise<string> {
  return toHex(await hmacSha256(botToken, 'learn-words-webhook'));
}
