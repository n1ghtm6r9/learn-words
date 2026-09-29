import type { Env } from '../env.type';
import { createMemoryStore } from './createMemoryStore';

export function testEnv(menus: Record<string, string> = {}): Env {
  return {
    BOT_TOKEN: '123456:TEST-token',
    APP_URL: 'https://example.github.io/learn-words/',
    ALLOWED_ORIGINS: 'https://example.github.io,http://localhost:5173',
    MENUS: createMemoryStore(menus),
  };
}
