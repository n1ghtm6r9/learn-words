import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUIStore } from '@/store/useUIStore';
import { speak } from './tts';
import { useSpeak } from './useSpeak';

vi.mock('./tts', () => ({ speak: vi.fn() }));

describe('useSpeak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({ studyLanguage: 'en' });
  });

  it('pronounces the term with the voice of the language being studied', () => {
    useUIStore.setState({ studyLanguage: 'es' });
    const { result } = renderHook(() => useSpeak());

    result.current('hola');

    expect(speak).toHaveBeenCalledWith('hola', 'es-ES');
  });

  it('switches voice as soon as the studied language changes', () => {
    const { result, rerender } = renderHook(() => useSpeak());

    result.current('hello');
    expect(speak).toHaveBeenLastCalledWith('hello', 'en-US');

    useUIStore.setState({ studyLanguage: 'es' });
    rerender();
    result.current('hola');

    expect(speak).toHaveBeenLastCalledWith('hola', 'es-ES');
  });
});
