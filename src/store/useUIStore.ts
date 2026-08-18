import { create } from 'zustand';
import type { Screen } from './screen.type';
import type { Theme } from './theme.type';
import type { AccentColor } from './accentColor.type';
import type { Language } from './language.type';

const DEFAULT_PHASE_REPEATS = 3;
const DEFAULT_ACCENT_COLOR: AccentColor = 'blue';
const ACCENT_COLORS: AccentColor[] = ['blue', 'green', 'purple', 'orange'];
const DEFAULT_LANGUAGE: Language = 'ru';
const LANGUAGES: Language[] = ['ru', 'en'];

interface UIStore {
  screen: Screen;
  setScreen: (screen: Screen) => void;

  addWordOpen: boolean;
  setAddWordOpen: (open: boolean) => void;

  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;

  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;

  language: Language;
  setLanguage: (language: Language) => void;

  phaseARepeats: number;
  setPhaseARepeats: (value: number) => void;

  phaseBRepeats: number;
  setPhaseBRepeats: (value: number) => void;
}

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
}

function readInitialAccentColor(): AccentColor {
  if (typeof window === 'undefined') return DEFAULT_ACCENT_COLOR;
  const stored = window.localStorage.getItem('accentColor');
  return (ACCENT_COLORS as string[]).includes(stored ?? '') ? (stored as AccentColor) : DEFAULT_ACCENT_COLOR;
}

function readInitialLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem('language');
  return (LANGUAGES as string[]).includes(stored ?? '') ? (stored as Language) : DEFAULT_LANGUAGE;
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

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  theme: readInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', next);
      }
      return { theme: next };
    }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', theme);
    }
    set({ theme });
  },

  accentColor: readInitialAccentColor(),
  setAccentColor: (color) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('accentColor', color);
    }
    set({ accentColor: color });
  },

  language: readInitialLanguage(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('language', language);
    }
    set({ language });
  },

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
