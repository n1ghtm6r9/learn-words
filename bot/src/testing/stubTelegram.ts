import { vi } from 'vitest';

export interface TelegramCall {
  method: string;
  body: Record<string, unknown> | FormData;
}

export function stubTelegram(results: Record<string, unknown> = {}, files: Record<string, string> = {}) {
  const calls: TelegramCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const fileMatch = /\/file\/bot[^/]+\/(.+)$/.exec(url);
    if (fileMatch) {
      const content = files[fileMatch[1]];
      return content === undefined ? new Response('missing', { status: 404 }) : new Response(content);
    }
    const method = url.split('/').pop() ?? '';
    const body = init?.body instanceof FormData ? init.body : JSON.parse(String(init?.body ?? '{}'));
    calls.push({ method, body });
    return Response.json({ ok: true, result: results[method] ?? true });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}
