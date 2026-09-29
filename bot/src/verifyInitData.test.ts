import { describe, expect, it } from 'vitest';
import { signInitData } from './testing/signInitData';
import { verifyInitData } from './verifyInitData';

const TOKEN = '123456:TEST-token';
const NOW_MS = 1_800_000_000_000;
const NOW_S = NOW_MS / 1000;

describe('verifyInitData', () => {
  it('returns the Telegram user id of genuine launch data', async () => {
    const initData = await signInitData(TOKEN, 42, NOW_S - 60);

    await expect(verifyInitData(initData, TOKEN, NOW_MS)).resolves.toBe(42);
  });

  it('rejects data signed with another bot token', async () => {
    const initData = await signInitData('999:other', 42, NOW_S - 60);

    await expect(verifyInitData(initData, TOKEN, NOW_MS)).resolves.toBeNull();
  });

  it('rejects data whose user was swapped after signing', async () => {
    const params = new URLSearchParams(await signInitData(TOKEN, 42, NOW_S - 60));
    params.set('user', JSON.stringify({ id: 7 }));

    await expect(verifyInitData(params.toString(), TOKEN, NOW_MS)).resolves.toBeNull();
  });

  it('rejects launch data older than a week', async () => {
    const initData = await signInitData(TOKEN, 42, NOW_S - 8 * 24 * 60 * 60);

    await expect(verifyInitData(initData, TOKEN, NOW_MS)).resolves.toBeNull();
  });

  it('rejects empty launch data from a keyboard button', async () => {
    await expect(verifyInitData('', TOKEN, NOW_MS)).resolves.toBeNull();
  });
});
