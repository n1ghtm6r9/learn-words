import { create } from 'zustand';
import type { Word } from '../db/db';
import type { MatchVerdict } from '../lib/fuzzyMatch';

export type Screen = 'home' | 'add' | 'study' | 'words' | 'stats';
export type Theme = 'light' | 'dark';

export interface StudySessionState {
  queue: Word[];
  index: number;
  correct: number;
  almost: number;
  wrong: number;
}

interface UIStore {
  screen: Screen;
  setScreen: (screen: Screen) => void;

  theme: Theme;
  toggleTheme: () => void;

  session: StudySessionState | null;
  startSession: (queue: Word[]) => void;
  recordAnswer: (verdict: MatchVerdict) => void;
  endSession: () => void;
}

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
}

export const useUIStore = create<UIStore>((set) => ({
  screen: 'home',
  setScreen: (screen) => set({ screen }),

  theme: readInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', next);
      }
      return { theme: next };
    }),

  session: null,
  startSession: (queue) =>
    set({ session: { queue, index: 0, correct: 0, almost: 0, wrong: 0 } }),
  recordAnswer: (verdict) =>
    set((state) => {
      if (!state.session) return state;
      const session = { ...state.session, [verdict]: state.session[verdict] + 1, index: state.session.index + 1 };
      return { session };
    }),
  endSession: () => set({ session: null }),
}));
