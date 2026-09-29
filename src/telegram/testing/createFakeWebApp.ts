import { vi } from 'vitest';
import type { TelegramWebApp } from '../telegramWebApp.type';

export function createFakeWebApp(colorScheme: 'light' | 'dark' = 'light') {
  const handlers = new Map<string, Array<() => void>>();
  const fake = {
    colorScheme,
    initData: 'query_id=test',
    close: vi.fn(),
    ready: vi.fn(),
    expand: vi.fn(),
    disableVerticalSwipes: vi.fn(),
    setHeaderColor: vi.fn(),
    setBackgroundColor: vi.fn(),
    setBottomBarColor: vi.fn(),
    onEvent: vi.fn((name: string, handler: () => void) => {
      handlers.set(name, [...(handlers.get(name) ?? []), handler]);
    }),
    offEvent: vi.fn((name: string, handler: () => void) => {
      handlers.set(name, (handlers.get(name) ?? []).filter((existing) => existing !== handler));
    }),
    emit(name: string) {
      handlers.get(name)?.forEach((handler) => handler());
    },
  };
  return { fake, webApp: fake as unknown as TelegramWebApp };
}
