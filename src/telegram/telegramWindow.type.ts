import type { TelegramWebApp } from './telegramWebApp.type';

export type TelegramWindow = Window & { Telegram?: { WebApp?: TelegramWebApp } };
