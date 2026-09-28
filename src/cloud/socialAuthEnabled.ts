import { isTelegramLaunch } from '@/telegram/isTelegramLaunch';

export const SOCIAL_AUTH_ENABLED = !isTelegramLaunch();
