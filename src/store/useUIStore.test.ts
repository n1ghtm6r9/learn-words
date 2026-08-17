import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './useUIStore';
import type { Word } from '../db/db';

function word(id: number): Word {
  return {
    id,
    term: `t${id}`,
    translation: `p${id}`,
    createdAt: 0,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: 0,
  };
}

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ screen: 'home', session: null });
    window.localStorage.clear();
  });

  it('setScreen меняет текущий экран', () => {
    useUIStore.getState().setScreen('study');
    expect(useUIStore.getState().screen).toBe('study');
  });

  it('toggleTheme переключает тему и сохраняет в localStorage', () => {
    const before = useUIStore.getState().theme;
    useUIStore.getState().toggleTheme();
    const after = useUIStore.getState().theme;

    expect(after).not.toBe(before);
    expect(window.localStorage.getItem('theme')).toBe(after);
  });

  it('startSession инициализирует сессию с нулевыми счётчиками', () => {
    useUIStore.getState().startSession([word(1), word(2)]);
    const session = useUIStore.getState().session;

    expect(session?.queue).toHaveLength(2);
    expect(session?.index).toBe(0);
    expect(session?.correct).toBe(0);
  });

  it('recordAnswer увеличивает счётчик и индекс', () => {
    useUIStore.getState().startSession([word(1), word(2)]);
    useUIStore.getState().recordAnswer('correct');

    const session = useUIStore.getState().session;
    expect(session?.correct).toBe(1);
    expect(session?.index).toBe(1);
  });

  it('endSession очищает сессию', () => {
    useUIStore.getState().startSession([word(1)]);
    useUIStore.getState().endSession();
    expect(useUIStore.getState().session).toBeNull();
  });
});
