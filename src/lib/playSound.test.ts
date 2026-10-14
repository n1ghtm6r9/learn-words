import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { playSound } from './playSound';
import { releaseAudioContext } from './releaseAudioContext';
import { SOUND_CUES } from './soundCues';
import { useUIStore } from '@/store/useUIStore';

function createParam() {
  return { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
}

const startedFrequencies: number[] = [];
const contexts: FakeAudioContext[] = [];

class FakeAudioContext {
  currentTime = 0;
  destination = {};
  state = 'running';
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => {
    this.state = 'closed';
    return Promise.resolve();
  });

  constructor() {
    contexts.push(this);
  }

  createOscillator() {
    const frequency = createParam();
    return {
      type: 'sine',
      frequency,
      onended: null,
      connect: vi.fn(),
      stop: vi.fn(),
      start: () => startedFrequencies.push(frequency.setValueAtTime.mock.calls[0][0]),
    };
  }

  createGain() {
    return { gain: createParam(), connect: vi.fn(), disconnect: vi.fn() };
  }
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

function latestContext(): FakeAudioContext {
  const context = contexts.at(-1);
  if (!context) throw new Error('no audio context was created');
  return context;
}

function frequenciesOf(cue: keyof typeof SOUND_CUES): number[] {
  return SOUND_CUES[cue].map((tone) => tone.frequency);
}

describe('playSound', () => {
  beforeAll(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  beforeEach(() => {
    startedFrequencies.length = 0;
    useUIStore.setState({ soundEffects: true });
  });

  afterEach(() => {
    setVisibility('visible');
  });

  it('plays every tone of an answer cue right away', () => {
    playSound('correct');

    expect(startedFrequencies).toEqual(frequenciesOf('correct'));
  });

  it('stays silent when sounds are turned off', () => {
    useUIStore.setState({ soundEffects: false });

    playSound('correct');
    playSound('wrong');
    playSound('finish');

    expect(startedFrequencies).toEqual([]);
  });

  it('wakes up audio the browser has suspended', () => {
    playSound('correct');
    const context = latestContext();
    context.state = 'suspended';

    playSound('finish');

    expect(context.resume).toHaveBeenCalledOnce();
    expect(latestContext()).toBe(context);
  });

  it('starts fresh audio after the app comes back from the background', () => {
    playSound('wrong');
    const beforeBackground = latestContext();

    setVisibility('hidden');
    expect(beforeBackground.close).toHaveBeenCalledOnce();

    setVisibility('visible');
    startedFrequencies.length = 0;
    playSound('correct');

    expect(latestContext()).not.toBe(beforeBackground);
    expect(startedFrequencies).toEqual(frequenciesOf('correct'));
  });

  it('starts fresh audio once the old one is released', () => {
    playSound('correct');
    const released = latestContext();

    releaseAudioContext();
    expect(released.close).toHaveBeenCalledOnce();

    startedFrequencies.length = 0;
    playSound('wrong');

    expect(latestContext()).not.toBe(released);
    expect(startedFrequencies).toEqual(frequenciesOf('wrong'));
  });

  it('replaces audio the system has interrupted', () => {
    playSound('correct');
    const interrupted = latestContext();
    interrupted.state = 'interrupted';

    startedFrequencies.length = 0;
    playSound('wrong');

    expect(interrupted.close).toHaveBeenCalledOnce();
    expect(latestContext()).not.toBe(interrupted);
    expect(startedFrequencies).toEqual(frequenciesOf('wrong'));
  });
});
