import { create } from 'zustand';
import type { TelegramLaunch } from './telegramLaunch.type';
import type { TelegramWebApp } from './telegramWebApp.type';

interface TelegramState {
  webApp: TelegramWebApp | null;
  launch: TelegramLaunch | null;
  clearLaunch: () => void;
}

export const useTelegramStore = create<TelegramState>((set) => ({
  webApp: null,
  launch: null,
  clearLaunch: () => set({ launch: null }),
}));
