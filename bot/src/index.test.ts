import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './index';
import { readFileTicket } from './readFileTicket';
import { signFileTicket } from './signFileTicket';
import { signInitData } from './testing/signInitData';
import { stubTelegram } from './testing/stubTelegram';
import { testEnv } from './testing/testEnv';

const TEST_ENV = testEnv();
import { webhookSecret } from './webhookSecret';

const ORIGIN = 'https://example.github.io';

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://bot.example.workers.dev${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
}

async function freshInitData(userId: number) {
  return signInitData(TEST_ENV.BOT_TOKEN, userId, Math.floor(Date.now() / 1000));
}

describe('worker', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('answers the CORS preflight for the app origin only', async () => {
    const preflight = (origin: string) =>
      worker.fetch(new Request('https://bot.example.workers.dev/export', { method: 'OPTIONS', headers: { Origin: origin } }), TEST_ENV);

    expect((await preflight(ORIGIN)).headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect((await preflight('https://evil.example')).headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('refuses webhook calls without the secret header', async () => {
    const { calls } = stubTelegram();

    const response = await worker.fetch(post('/telegram', { update_id: 1 }), TEST_ENV);

    expect(response.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it('handles webhook calls that carry the secret', async () => {
    const { calls } = stubTelegram({ sendMessage: { message_id: 5, chat: { id: 42, type: 'private' } } });
    const update = { update_id: 1, message: { message_id: 1, chat: { id: 42, type: 'private' }, text: '/menu' } };

    const response = await worker.fetch(
      post('/telegram', update, { 'X-Telegram-Bot-Api-Secret-Token': await webhookSecret(TEST_ENV.BOT_TOKEN) }),
      TEST_ENV,
    );

    expect(response.status).toBe(200);
    expect(calls[0].method).toBe('sendMessage');
  });

  it('sends an export to the chat of the verified user and adds an import button to it', async () => {
    const { calls } = stubTelegram({
      sendDocument: { message_id: 9, chat: { id: 42, type: 'private' }, document: { file_id: 'SENT-FILE' } },
    });

    const response = await worker.fetch(
      post('/export', { initData: await freshInitData(42), fileName: 'learn-words-en.json', content: '{"a":1}' }),
      TEST_ENV,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    const form = calls[0].body as FormData;
    expect(calls[0].method).toBe('sendDocument');
    expect(form.get('chat_id')).toBe('42');
    const document = form.get('document') as File;
    expect(document.name).toBe('learn-words-en.json');
    expect(await document.text()).toBe('{"a":1}');

    const edit = calls[1].body as { message_id: number; reply_markup: { inline_keyboard: Array<Array<{ web_app: { url: string } }>> } };
    expect(calls[1].method).toBe('editMessageReplyMarkup');
    expect(edit.message_id).toBe(9);
    const ticket = new URL(edit.reply_markup.inline_keyboard[0][0].web_app.url).searchParams.get('file') ?? '';
    await expect(readFileTicket(ticket, 42, TEST_ENV.BOT_TOKEN)).resolves.toBe('SENT-FILE');
  });

  it('refuses an export without genuine launch data', async () => {
    const { calls } = stubTelegram();

    const response = await worker.fetch(
      post('/export', { initData: 'user=%7B%22id%22%3A42%7D&hash=abc', fileName: 'x.json', content: '{}' }),
      TEST_ENV,
    );

    expect(response.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it('reports a Telegram failure as a bad gateway', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: false, description: 'Forbidden: bot was blocked' })));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await worker.fetch(
      post('/export', { initData: await freshInitData(42), fileName: 'x.json', content: '{}' }),
      TEST_ENV,
    );

    expect(response.status).toBe(502);
  });

  it('hands a chat file to the user its ticket was issued to', async () => {
    stubTelegram({ getFile: { file_path: 'documents/file_3.json' } }, { 'documents/file_3.json': '{"words":[]}' });
    const ticket = await signFileTicket('FILE-3', 42, TEST_ENV.BOT_TOKEN);

    const response = await worker.fetch(post('/file', { initData: await freshInitData(42), ticket }), TEST_ENV);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ fileName: 'file_3.json', content: '{"words":[]}' });
  });

  it('refuses a chat file ticket that belongs to someone else', async () => {
    const { calls } = stubTelegram();
    const ticket = await signFileTicket('FILE-3', 42, TEST_ENV.BOT_TOKEN);

    const response = await worker.fetch(post('/file', { initData: await freshInitData(7), ticket }), TEST_ENV);

    expect(response.status).toBe(403);
    expect(calls).toEqual([]);
  });
});
