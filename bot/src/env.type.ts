import type { KeyValueStore } from './keyValueStore.type';

export interface Env {
  BOT_TOKEN: string;
  APP_URL: string;
  ALLOWED_ORIGINS: string;
  MENUS: KeyValueStore;
}
