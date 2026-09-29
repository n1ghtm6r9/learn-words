import { useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { focusWordSearch } from './focusWordSearch';
import { isTypingTarget } from './isTypingTarget';

const SCREEN_BY_CODE = {
  Digit1: 'newWords',
  Digit2: 'review',
  Digit3: 'words',
} as const;

export function useGlobalHotkeys(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey) return;
      const state = useUIStore.getState();
      const dialogOpen = state.addWordOpen || state.settingsOpen || state.foldersOpen || state.tagsOpen;

      if (event.code === 'Escape') {
        if (state.selectingWords && !dialogOpen) state.setSelectingWords(false);
        return;
      }

      if (dialogOpen || (!event.altKey && isTypingTarget(event.target))) return;

      if (event.code in SCREEN_BY_CODE) {
        event.preventDefault();
        state.setScreen(SCREEN_BY_CODE[event.code as keyof typeof SCREEN_BY_CODE]);
        return;
      }

      if (event.code === 'KeyN') {
        event.preventDefault();
        state.setAddWordOpen(true);
        return;
      }

      if (event.code === 'Slash') {
        event.preventDefault();
        state.setScreen('words');
        focusWordSearch();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
