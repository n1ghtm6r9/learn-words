import { initDataHash } from '../initDataHash';

export async function signInitData(botToken: string, userId: number, authDate: number): Promise<string> {
  const params = new URLSearchParams({
    auth_date: String(authDate),
    query_id: 'AAE-test',
    user: JSON.stringify({ id: userId, first_name: 'Test' }),
  });
  params.set('hash', await initDataHash(params, botToken));
  return params.toString();
}
