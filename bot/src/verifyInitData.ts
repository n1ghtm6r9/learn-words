import { INIT_DATA_MAX_AGE_SECONDS } from './initDataMaxAgeSeconds';
import { initDataHash } from './initDataHash';
import { safeEqual } from './safeEqual';

export async function verifyInitData(initData: string, botToken: string, nowMs: number): Promise<number | null> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  if (!safeEqual(await initDataHash(params, botToken), hash)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || nowMs / 1000 - authDate > INIT_DATA_MAX_AGE_SECONDS) return null;

  try {
    const user = JSON.parse(params.get('user') ?? 'null') as { id?: unknown } | null;
    return typeof user?.id === 'number' ? user.id : null;
  } catch {
    return null;
  }
}
