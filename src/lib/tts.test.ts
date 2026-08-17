import { afterEach, describe, expect, it, vi } from 'vitest';
import { isSpeechSupported, speak } from './tts';

describe('tts', () => {
  afterEach(() => {
    // @ts-expect-error — убираем тестовый мок между тестами
    delete window.speechSynthesis;
    vi.restoreAllMocks();
  });

  it('isSpeechSupported возвращает false, если API недоступен', () => {
    expect(isSpeechSupported()).toBe(false);
  });

  it('speak вызывает cancel и speak с текстом', () => {
    const cancel = vi.fn();
    const speakFn = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel, speak: speakFn },
    });

    speak('hello', 'en-US');

    expect(cancel).toHaveBeenCalledOnce();
    expect(speakFn).toHaveBeenCalledOnce();
    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe('hello');
    expect(utterance.lang).toBe('en-US');
  });

  it('speak ничего не делает, если API недоступен', () => {
    expect(() => speak('hello')).not.toThrow();
  });
});
