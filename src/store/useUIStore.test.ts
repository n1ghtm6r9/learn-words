import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ screen: 'newWords', theme: 'light', phaseARepeats: 3, phaseBRepeats: 3 });
    window.localStorage.clear();
  });

  it('setScreen меняет текущий экран', () => {
    useUIStore.getState().setScreen('review');
    expect(useUIStore.getState().screen).toBe('review');
  });

  it('setAddWordOpen переключает видимость попапа добавления слова', () => {
    useUIStore.getState().setAddWordOpen(true);
    expect(useUIStore.getState().addWordOpen).toBe(true);
    useUIStore.getState().setAddWordOpen(false);
    expect(useUIStore.getState().addWordOpen).toBe(false);
  });

  it('toggleTheme переключает тему и сохраняет в localStorage', () => {
    const before = useUIStore.getState().theme;
    useUIStore.getState().toggleTheme();
    const after = useUIStore.getState().theme;

    expect(after).not.toBe(before);
    expect(window.localStorage.getItem('theme')).toBe(after);
  });

  it('setPhaseARepeats обновляет значение и сохраняет в localStorage', () => {
    useUIStore.getState().setPhaseARepeats(5);
    expect(useUIStore.getState().phaseARepeats).toBe(5);
    expect(window.localStorage.getItem('phaseARepeats')).toBe('5');
  });

  it('setPhaseBRepeats обновляет значение и сохраняет в localStorage', () => {
    useUIStore.getState().setPhaseBRepeats(7);
    expect(useUIStore.getState().phaseBRepeats).toBe(7);
    expect(window.localStorage.getItem('phaseBRepeats')).toBe('7');
  });
});
