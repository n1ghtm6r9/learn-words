export async function callTelegram<T>(botToken: string, method: string, body: object | FormData): Promise<T> {
  const init: RequestInit =
    body instanceof FormData
      ? { method: 'POST', body }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, init);
  const payload = (await response.json()) as { ok: boolean; result?: T; description?: string };
  if (!payload.ok) throw new Error(`${method}: ${payload.description ?? response.status}`);
  return payload.result as T;
}
