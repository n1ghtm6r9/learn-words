import { hmacSha256 } from './hmacSha256';
import { initDataDataCheckString } from './initDataDataCheckString';
import { toHex } from './toHex';

export async function initDataHash(params: URLSearchParams, botToken: string): Promise<string> {
  const secretKey = await hmacSha256('WebAppData', botToken);
  return toHex(await hmacSha256(secretKey, initDataDataCheckString(params)));
}
