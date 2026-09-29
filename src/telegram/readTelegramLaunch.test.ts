import { afterEach, describe, expect, it } from 'vitest';
import { readTelegramLaunch } from './readTelegramLaunch';

describe('readTelegramLaunch', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('returns null without launch parameters and leaves the URL alone', () => {
    window.history.replaceState(null, '', '/?a=1#x');

    expect(readTelegramLaunch()).toBeNull();
    expect(window.location.search + window.location.hash).toBe('?a=1#x');
  });

  it('reads the export action', () => {
    window.history.replaceState(null, '', '/?tg=export');

    expect(readTelegramLaunch()).toEqual({ action: 'export' });
  });

  it('reads the import action with and without a ticket', () => {
    window.history.replaceState(null, '', '/?tg=import');
    expect(readTelegramLaunch()).toEqual({ action: 'import', ticket: null });

    window.history.replaceState(null, '', '/?tg=import&file=abc');
    expect(readTelegramLaunch()).toEqual({ action: 'import', ticket: 'abc' });
  });

  it('ignores an unknown action', () => {
    window.history.replaceState(null, '', '/?tg=nope');

    expect(readTelegramLaunch()).toBeNull();
  });

  it('removes its parameters but keeps the path, other parameters and the hash', () => {
    window.history.replaceState(null, '', '/learn-words/?tg=import&file=abc&keep=1#tgWebAppData=x');

    readTelegramLaunch();

    expect(window.location.pathname).toBe('/learn-words/');
    expect(window.location.search).toBe('?keep=1');
    expect(window.location.hash).toBe('#tgWebAppData=x');
  });
});
