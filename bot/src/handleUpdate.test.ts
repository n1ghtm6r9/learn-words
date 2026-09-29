import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleUpdate } from './handleUpdate';
import { readFileTicket } from './readFileTicket';
import { stubTelegram } from './testing/stubTelegram';
import { testEnv } from './testing/testEnv';

const TEST_ENV = testEnv();

function privateMessage(fields: Record<string, unknown>) {
  return { update_id: 1, message: { message_id: 10, chat: { id: 42, type: 'private' }, from: { id: 42 }, ...fields } };
}

function buttonUrls(body: unknown): string[] {
  const markup = (body as { reply_markup: { inline_keyboard: Array<Array<{ web_app: { url: string } }>> } })
    .reply_markup;
  return markup.inline_keyboard.flat().map((button) => button.web_app.url);
}

describe('handleUpdate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('answers /start with the export/import menu without pinning it', async () => {
    const { calls } = stubTelegram({ sendMessage: { message_id: 77, chat: { id: 42, type: 'private' } } });

    await handleUpdate(privateMessage({ text: '/start' }), testEnv());

    expect(calls.map((call) => call.method)).toEqual(['sendMessage']);
    expect(buttonUrls(calls[0].body)).toEqual([
      'https://example.github.io/learn-words/?tg=export',
      'https://example.github.io/learn-words/?tg=import',
      'https://example.github.io/learn-words/',
    ]);
  });

  it('replaces the previous menu so the chat keeps only one', async () => {
    const env = testEnv({ '42': '70' });
    const { calls } = stubTelegram({ sendMessage: { message_id: 78, chat: { id: 42, type: 'private' } } });

    await handleUpdate(privateMessage({ text: '/menu' }), env);

    expect(calls.map((call) => call.method)).toEqual(['sendMessage', 'deleteMessage']);
    expect(calls[1].body).toEqual({ chat_id: 42, message_id: 70 });
    await expect(env.MENUS.get('42')).resolves.toBe('78');
  });

  it('keeps the new menu when the old one can no longer be deleted', async () => {
    const env = testEnv({ '42': '3' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith('/deleteMessage')
          ? Response.json({ ok: false, description: "Bad Request: message can't be deleted" })
          : Response.json({ ok: true, result: { message_id: 90, chat: { id: 42, type: 'private' } } }),
      ),
    );

    await expect(handleUpdate(privateMessage({ text: '/menu' }), env)).resolves.toBeUndefined();
    await expect(env.MENUS.get('42')).resolves.toBe('90');
  });

  it('stays silent on ordinary text', async () => {
    const { calls } = stubTelegram();

    await handleUpdate(privateMessage({ text: 'hello' }), testEnv());

    expect(calls).toEqual([]);
  });

  it('offers a single export button for /export', async () => {
    const { calls } = stubTelegram();

    await handleUpdate(privateMessage({ text: '/export@nm_learn_words_bot' }), TEST_ENV);

    expect(buttonUrls(calls[0].body)).toEqual(['https://example.github.io/learn-words/?tg=export']);
  });

  it('offers to import a JSON file sent to the chat with a ticket bound to the sender', async () => {
    const { calls } = stubTelegram();

    await handleUpdate(
      privateMessage({ document: { file_id: 'FILE-1', file_name: 'backup.json', mime_type: 'application/json' } }),
      TEST_ENV,
    );

    const [url] = buttonUrls(calls[0].body);
    const params = new URL(url).searchParams;
    expect(params.get('tg')).toBe('import');
    await expect(readFileTicket(params.get('file') ?? '', 42, TEST_ENV.BOT_TOKEN)).resolves.toBe('FILE-1');
    expect(calls[0].body).toMatchObject({ reply_parameters: { message_id: 10 } });
  });

  it('explains that other files are not exports', async () => {
    const { calls } = stubTelegram();

    await handleUpdate(
      privateMessage({ document: { file_id: 'FILE-2', file_name: 'photo.png', mime_type: 'image/png' } }),
      TEST_ENV,
    );

    expect(calls[0].body).toMatchObject({ text: expect.stringContaining('.json') });
    expect(calls[0].body).not.toHaveProperty('reply_markup');
  });

  it('ignores group chats', async () => {
    const { calls } = stubTelegram();

    await handleUpdate(
      { update_id: 1, message: { message_id: 1, chat: { id: -5, type: 'group' }, text: '/start' } },
      TEST_ENV,
    );

    expect(calls).toEqual([]);
  });
});
