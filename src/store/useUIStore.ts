import { create } from 'zustand';
import type { Screen } from './screen.type';
import type { Theme } from './theme.type';

const DEFAULT_PHASE_REPEATS = 3;

interface UIStore {
  screen: Screen;
  setScreen: (screen: Screen) => void;

  addWordOpen: boolean;
  setAddWordOpen: (open: boolean) => void;

  theme: Theme;
  toggleTheme: () => void;

  phaseARepeats: number;
  setPhaseARepeats: (value: number) => void;

  phaseBRepeats: number;
  setPhaseBRepeats: (value: number) => void;
}

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
}

function readInitialNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(key);
  const parsed = stored ? Number(stored) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const useUIStore = create<UIStore>((set) => ({
  screen: 'newWords',
  setScreen: (screen) => set({ screen }),

  addWordOpen: false,
  setAddWordOpen: (open) => set({ addWordOpen: open }),

  theme: readInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', next);
      }
      return { theme: next };
    }),

  phaseARepeats: readInitialNumber('phaseARepeats', DEFAULT_PHASE_REPEATS),
  setPhaseARepeats: (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('phaseARepeats', String(value));
    }
    set({ phaseARepeats: value });
  },

  phaseBRepeats: readInitialNumber('phaseBRepeats', DEFAULT_PHASE_REPEATS),
  setPhaseBRepeats: (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('phaseBRepeats', String(value));
    }
    set({ phaseBRepeats: value });
  },
}));
