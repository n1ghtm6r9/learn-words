import { create } from 'zustand';

interface KeyboardState {
  expected: boolean;
  onScreen: boolean;
}

export const useKeyboardStore = create<KeyboardState>(() => ({
  expected: false,
  onScreen: false,
}));
