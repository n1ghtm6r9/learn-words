import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportDialog } from './ExportDialog';
import { getDb } from '@/db/getDb';
import { useUIStore } from '@/store/useUIStore';
import { createFakeWebApp } from '@/telegram/testing/createFakeWebApp';
import { useTelegramStore } from '@/telegram/useTelegramStore';

vi.mock('@/telegram/telegramRelayUrl', () => ({ TELEGRAM_RELAY_URL: 'https://relay.test' }));

const db = getDb('en');

describe('ExportDialog inside Telegram', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ studyLanguage: 'en' });
    const { webApp } = createFakeWebApp();
    useTelegramStore.setState({ webApp });
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });

  afterEach(() => {
    useTelegramStore.setState({ webApp: null, launch: null });
    vi.unstubAllGlobals();
  });

  it('sends the export to the chat instead of downloading it', async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const onSentToChat = vi.fn();
    const user = userEvent.setup();
    render(<ExportDialog open onOpenChange={vi.fn()} onSentToChat={onSentToChat} />);

    await user.click(screen.getByRole('button', { name: 'Отправить в чат' }));

    expect(await screen.findByText('Файл отправлен в чат с ботом')).toBeInTheDocument();
    expect(onSentToChat).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://relay.test/export');
    const body = JSON.parse(String(init.body));
    expect(body.initData).toBe('query_id=test');
    expect(body.fileName).toMatch(/^learn-words-en-export-\d{4}-\d{2}-\d{2}\.json$/);
    expect(JSON.parse(body.content)).toHaveProperty('words');
  });

  it('offers to send again after the dialog was closed and reopened', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true })));
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<ExportDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Отправить в чат' }));
    await user.click(await screen.findByRole('button', { name: 'Готово' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(<ExportDialog open={false} onOpenChange={onOpenChange} />);
    rerender(<ExportDialog open onOpenChange={onOpenChange} />);

    expect(await screen.findByRole('button', { name: 'Отправить в чат' })).toBeInTheDocument();
  });

  it('shows the failure and keeps the mini app open when the relay fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: false }, { status: 502 })));
    const onSentToChat = vi.fn();
    const user = userEvent.setup();
    render(<ExportDialog open onOpenChange={vi.fn()} onSentToChat={onSentToChat} />);

    await user.click(screen.getByRole('button', { name: 'Отправить в чат' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Не удалось выгрузить данные'));
    expect(onSentToChat).not.toHaveBeenCalled();
  });
});
