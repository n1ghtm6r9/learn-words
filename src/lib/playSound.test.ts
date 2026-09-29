import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { playSound } from './playSound';
import { SOUND_CUES } from './soundCues';
import { useUIStore } from '@/store/useUIStore';

function createParam() {
  return { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
}

const startedFrequencies: number[] = [];
const resume = vi.fn(() => Promise.resolve());
let contextState: AudioContextState = 'running';

class FakeAudioContext {
  currentTime = 0;
  destination = {};
  resume = resume;

  get state() {
    return contextState;
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

describe('playSound', () => {
  beforeAll(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  beforeEach(() => {
    startedFrequencies.length = 0;
    resume.mockClear();
    contextState = 'running';
    useUIStore.setState({ soundEffects: true });
  });

  it('plays every tone of an answer cue right away', () => {
    playSound('correct');

    expect(startedFrequencies).toEqual(SOUND_CUES.correct.map((tone) => tone.frequency));
  });

  it('stays silent when sounds are turned off', () => {
    useUIStore.setState({ soundEffects: false });

    playSound('correct');
    playSound('wrong');
    playSound('finish');

    expect(startedFrequencies).toEqual([]);
  });

  it('wakes up audio the browser has suspended', () => {
    contextState = 'suspended';

    playSound('finish');

    expect(resume).toHaveBeenCalledOnce();
  });
});
