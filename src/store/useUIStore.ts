import { create } from 'zustand';
import { ACCENT_PALETTE } from '@/lib/accentPalette';
import { TRANSLATIONS } from '@/lib/translations';
import { parsePositiveInt } from '@/lib/parsePositiveInt';
import { MIN_PHASE_REPEATS, MAX_PHASE_REPEATS } from '@/lib/phaseRepeatsRange';
import type { Screen } from './screen.type';
import type { Theme } from './theme.type';
import type { AccentColor } from './accentColor.type';
import type { Language } from './language.type';

const DEFAULT_PHASE_REPEATS = 3;
const DEFAULT_ACCENT_COLOR: AccentColor = 'blue';
const ACCENT_COLORS = Object.keys(ACCENT_PALETTE) as AccentColor[];
const DEFAULT_LANGUAGE: Language = 'ru';
const LANGUAGES = Object.keys(TRANSLATIONS) as Language[];

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

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
  return safeGetItem('theme') === 'dark' ? 'dark' : 'light';
}

function readInitialAccentColor(): AccentColor {
  const stored = safeGetItem('accentColor');
  return (ACCENT_COLORS as string[]).includes(stored ?? '') ? (stored as AccentColor) : DEFAULT_ACCENT_COLOR;
}

function readInitialLanguage(): Language {
  const stored = safeGetItem('language');
  return (LANGUAGES as string[]).includes(stored ?? '') ? (stored as Language) : DEFAULT_LANGUAGE;
}

function readInitialNumber(key: string, fallback: number): number {
  const stored = safeGetItem(key);
  if (stored == null) return fallback;
  return parsePositiveInt(stored, MIN_PHASE_REPEATS, MAX_PHASE_REPEATS) ?? fallback;
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
      safeSetItem('theme', next);
      return { theme: next };
    }),
  setTheme: (theme) => {
    safeSetItem('theme', theme);
    set({ theme });
  },

  accentColor: readInitialAccentColor(),
  setAccentColor: (color) => {
    safeSetItem('accentColor', color);
    set({ accentColor: color });
  },

  language: readInitialLanguage(),
  setLanguage: (language) => {
    safeSetItem('language', language);
    set({ language });
  },

  phaseARepeats: readInitialNumber('phaseARepeats', DEFAULT_PHASE_REPEATS),
  setPhaseARepeats: (value) => {
    safeSetItem('phaseARepeats', String(value));
    set({ phaseARepeats: value });
  },

  phaseBRepeats: readInitialNumber('phaseBRepeats', DEFAULT_PHASE_REPEATS),
  setPhaseBRepeats: (value) => {
    safeSetItem('phaseBRepeats', String(value));
    set({ phaseBRepeats: value });
  },
}));
