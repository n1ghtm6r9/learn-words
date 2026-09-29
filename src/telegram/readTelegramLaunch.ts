import type { TelegramLaunch } from './telegramLaunch.type';

export function readTelegramLaunch(): TelegramLaunch | null {
  const url = new URL(window.location.href);
  const action = url.searchParams.get('tg');
  const ticket = url.searchParams.get('file');
  if (action === null && ticket === null) return null;

  url.searchParams.delete('tg');
  url.searchParams.delete('file');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);

  if (action === 'export') return { action: 'export' };
  if (action === 'import') return { action: 'import', ticket: ticket || null };
  return null;
}
