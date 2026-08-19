import { afterEach, describe, expect, it, vi } from 'vitest';
import { isSpeechSupported, speak } from './tts';

describe('tts', () => {
  afterEach(() => {
    // @ts-expect-error
    delete window.speechSynthesis;
    vi.restoreAllMocks();
  });

  it('isSpeechSupported returns false when the API is unavailable', () => {
    expect(isSpeechSupported()).toBe(false);
  });

  it('speak calls cancel and speak with the text', () => {
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

  it('speak does nothing when the API is unavailable', () => {
    expect(() => speak('hello')).not.toThrow();
  });
});
