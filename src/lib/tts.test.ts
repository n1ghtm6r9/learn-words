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

  it('speaks with a voice of the requested language when the browser offers several', () => {
    const speakFn = vi.fn();
    const voices = [{ lang: 'en-US' }, { lang: 'es-ES' }];
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel: vi.fn(), speak: speakFn, getVoices: () => voices },
    });

    speak('hola', 'es-ES');

    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.voice).toBe(voices[1]);
  });

  it('falls back to another region of the same language', () => {
    const speakFn = vi.fn();
    const voices = [{ lang: 'en-GB' }, { lang: 'es-MX' }];
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel: vi.fn(), speak: speakFn, getVoices: () => voices },
    });

    speak('hola', 'es-ES');

    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.voice).toBe(voices[1]);
  });

  it('still speaks when the browser exposes no voices for the language', () => {
    const speakFn = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel: vi.fn(), speak: speakFn, getVoices: () => [{ lang: 'en-US' }] },
    });

    speak('hola', 'es-ES');

    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.voice).toBeUndefined();
    expect(utterance.lang).toBe('es-ES');
  });

  it('leaves the engine default alone when it already speaks the requested language', () => {
    const speakFn = vi.fn();
    const voices = [{ lang: 'en-US', default: false }, { lang: 'en-US', default: true }];
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel: vi.fn(), speak: speakFn, getVoices: () => voices },
    });

    speak('hello', 'en-US');

    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.voice).toBeUndefined();
  });

  it('prefers the default voice among several of the requested language', () => {
    const speakFn = vi.fn();
    const voices = [
      { lang: 'en-US', default: true },
      { lang: 'es-ES', default: false },
      { lang: 'es-ES', default: true },
    ];
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel: vi.fn(), speak: speakFn, getVoices: () => voices },
    });

    speak('hola', 'es-ES');

    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.voice).toBe(voices[2]);
  });
});
