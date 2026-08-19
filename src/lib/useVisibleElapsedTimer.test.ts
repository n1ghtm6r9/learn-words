import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVisibleElapsedTimer } from './useVisibleElapsedTimer';

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useVisibleElapsedTimer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setVisibility('visible');
  });

  it('measures elapsed time while the page stays visible', () => {
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000);
    const { result } = renderHook(() => useVisibleElapsedTimer());

    nowSpy.mockReturnValue(3500);
    expect(result.current.elapsedMs()).toBe(2500);
  });

  it('does not count time spent with the page hidden', () => {
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000);
    const { result } = renderHook(() => useVisibleElapsedTimer());

    nowSpy.mockReturnValue(2000);
    setVisibility('hidden');

    nowSpy.mockReturnValue(60000);
    setVisibility('visible');

    nowSpy.mockReturnValue(60500);
    expect(result.current.elapsedMs()).toBe(1500);
  });

  it('freezes the measurement while still hidden', () => {
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000);
    const { result } = renderHook(() => useVisibleElapsedTimer());

    nowSpy.mockReturnValue(2000);
    setVisibility('hidden');

    nowSpy.mockReturnValue(90000);
    expect(result.current.elapsedMs()).toBe(1000);
  });

  it('restart resets the measurement to zero', () => {
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000);
    const { result } = renderHook(() => useVisibleElapsedTimer());

    nowSpy.mockReturnValue(5000);
    result.current.restart();
    expect(result.current.elapsedMs()).toBe(0);

    nowSpy.mockReturnValue(5750);
    expect(result.current.elapsedMs()).toBe(750);
  });

  it('removes exactly the listener it registered when unmounted', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useVisibleElapsedTimer());

    const registered = addSpy.mock.calls.find(([type]) => type === 'visibilitychange')?.[1];
    expect(registered).toBeDefined();

    unmount();

    const removed = removeSpy.mock.calls.find(([type]) => type === 'visibilitychange')?.[1];
    expect(removed).toBe(registered);
  });

  it('does not count time when the card mounts while the tab is already hidden', () => {
    setVisibility('hidden');
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000);
    const { result } = renderHook(() => useVisibleElapsedTimer());

    nowSpy.mockReturnValue(300000);
    setVisibility('visible');

    nowSpy.mockReturnValue(300100);
    expect(result.current.elapsedMs()).toBe(100);
  });
});
