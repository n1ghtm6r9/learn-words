import { create } from 'zustand';
import { ACCENT_PALETTE } from '@/lib/accentPalette';
import { STUDY_LANGUAGES } from '@/languages/studyLanguages';
import { UI_LANGUAGES } from '@/i18n/uiLanguages';
import { parsePositiveInt } from '@/lib/parsePositiveInt';
import { MIN_PHASE_REPEATS, MAX_PHASE_REPEATS } from '@/lib/phaseRepeatsRange';
import { DEFAULT_REVIEW_LIMIT, MIN_REVIEW_LIMIT, MAX_REVIEW_LIMIT } from '@/lib/reviewLimitRange';
import type { Screen } from './screen.type';
import type { Theme } from './theme.type';
import type { AccentColor } from './accentColor.type';
import type { UiLanguage } from '@/i18n/uiLanguage.type';
import type { StudyLanguage } from '@/languages/studyLanguage.type';

const DEFAULT_PHASE_REPEATS = 3;
const DEFAULT_ACCENT_COLOR: AccentColor = 'blue';
const ACCENT_COLORS = Object.keys(ACCENT_PALETTE) as AccentColor[];
const DEFAULT_LANGUAGE: UiLanguage = 'ru';
const DEFAULT_STUDY_LANGUAGE: StudyLanguage = 'en';

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

  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;

  studyLanguage: StudyLanguage;
  setStudyLanguage: (language: StudyLanguage) => void;

  phaseARepeats: number;
  setPhaseARepeats: (value: number) => void;

  phaseBRepeats: number;
  setPhaseBRepeats: (value: number) => void;

  reviewLimit: number;
  setReviewLimit: (value: number) => void;
}

function readInitialTheme(): Theme {
  return safeGetItem('theme') === 'dark' ? 'dark' : 'light';
}

function readInitialAccentColor(): AccentColor {
  const stored = safeGetItem('accentColor');
  return (ACCENT_COLORS as string[]).includes(stored ?? '') ? (stored as AccentColor) : DEFAULT_ACCENT_COLOR;
}

function readInitialLanguage(): UiLanguage {
  const stored = safeGetItem('language');
  return (UI_LANGUAGES as string[]).includes(stored ?? '') ? (stored as UiLanguage) : DEFAULT_LANGUAGE;
}

function readInitialStudyLanguage(): StudyLanguage {
  const stored = safeGetItem('studyLanguage');
  return (STUDY_LANGUAGES as string[]).includes(stored ?? '')
    ? (stored as StudyLanguage)
    : DEFAULT_STUDY_LANGUAGE;
}

function readInitialNumber(key: string, fallback: number, min: number, max: number): number {
  const stored = safeGetItem(key);
  if (stored == null) return fallback;
  return parsePositiveInt(stored, min, max) ?? fallback;
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

  studyLanguage: readInitialStudyLanguage(),
  setStudyLanguage: (studyLanguage) => {
    safeSetItem('studyLanguage', studyLanguage);
    set({ studyLanguage });
  },

  phaseARepeats: readInitialNumber('phaseARepeats', DEFAULT_PHASE_REPEATS, MIN_PHASE_REPEATS, MAX_PHASE_REPEATS),
  setPhaseARepeats: (value) => {
    safeSetItem('phaseARepeats', String(value));
    set({ phaseARepeats: value });
  },

  phaseBRepeats: readInitialNumber('phaseBRepeats', DEFAULT_PHASE_REPEATS, MIN_PHASE_REPEATS, MAX_PHASE_REPEATS),
  setPhaseBRepeats: (value) => {
    safeSetItem('phaseBRepeats', String(value));
    set({ phaseBRepeats: value });
  },

  reviewLimit: readInitialNumber('reviewLimit', DEFAULT_REVIEW_LIMIT, MIN_REVIEW_LIMIT, MAX_REVIEW_LIMIT),
  setReviewLimit: (value) => {
    safeSetItem('reviewLimit', String(value));
    set({ reviewLimit: value });
  },
}));
