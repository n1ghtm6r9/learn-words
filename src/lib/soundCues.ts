import type { SoundCue } from './soundCue.type';
import type { SoundTone } from './soundTone.type';

export const SOUND_CUES: Record<SoundCue, SoundTone[]> = {
  correct: [
    { wave: 'sine', frequency: 987.77, offset: 0, duration: 0.16, volume: 0.15 },
    { wave: 'sine', frequency: 1318.51, offset: 0.085, duration: 0.34, volume: 0.15 },
    { wave: 'triangle', frequency: 659.25, offset: 0.085, duration: 0.3, volume: 0.05 },
  ],
  wrong: [
    { wave: 'triangle', frequency: 293.66, endFrequency: 277.18, offset: 0, duration: 0.16, volume: 0.17 },
    { wave: 'triangle', frequency: 220, endFrequency: 196, offset: 0.13, duration: 0.28, volume: 0.17 },
  ],
  finish: [
    { wave: 'sine', frequency: 523.25, offset: 0, duration: 0.2, volume: 0.13 },
    { wave: 'sine', frequency: 659.25, offset: 0.09, duration: 0.2, volume: 0.13 },
    { wave: 'sine', frequency: 783.99, offset: 0.18, duration: 0.22, volume: 0.13 },
    { wave: 'sine', frequency: 1046.5, offset: 0.27, duration: 0.55, volume: 0.14 },
    { wave: 'triangle', frequency: 523.25, offset: 0.27, duration: 0.5, volume: 0.05 },
  ],
};
