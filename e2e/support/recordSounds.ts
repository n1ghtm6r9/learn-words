import type { Page } from '@playwright/test';

export async function recordSounds(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const playedTones: number[] = [];
    const audioContexts: AudioContext[] = [];
    Object.assign(window, { playedTones, audioContexts });
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        audioContexts.push(this);
      }

      createOscillator(): OscillatorNode {
        const oscillator = super.createOscillator();
        const setValueAtTime = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
        oscillator.frequency.setValueAtTime = (value: number, startTime: number) => {
          playedTones.push(value);
          return setValueAtTime(value, startTime);
        };
        return oscillator;
      }
    };
  });
}
