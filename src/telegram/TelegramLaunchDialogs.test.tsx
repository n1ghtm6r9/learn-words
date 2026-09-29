import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TelegramLaunchDialogs } from './TelegramLaunchDialogs';
import { createFakeWebApp } from './testing/createFakeWebApp';
import { useTelegramStore } from './useTelegramStore';

vi.mock('./fetchTelegramChatFile', () => ({
  fetchTelegramChatFile: vi.fn(() =>
    Promise.resolve(new File([JSON.stringify({ version: 2, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] })], 'chat.json')),
  ),
}));

describe('TelegramLaunchDialogs', () => {
  afterEach(() => {
    useTelegramStore.setState({ webApp: null, launch: null });
  });

  it('renders nothing outside Telegram', () => {
    const { container } = render(<TelegramLaunchDialogs />);

    expect(container).toBeEmptyDOMElement();
  });

  it('opens the export dialog for an export launch', async () => {
    const { webApp } = createFakeWebApp();
    useTelegramStore.setState({ webApp, launch: { action: 'export' } });

    render(<TelegramLaunchDialogs />);

    expect(await screen.findByText('Экспорт данных')).toBeInTheDocument();
  });

  it('opens the import dialog preloaded with the chat file', async () => {
    const { webApp } = createFakeWebApp();
    useTelegramStore.setState({ webApp, launch: { action: 'import', ticket: 't1' } });

    render(<TelegramLaunchDialogs />);

    expect(await screen.findByText('Найдено слов: 1')).toBeInTheDocument();
  });
});
