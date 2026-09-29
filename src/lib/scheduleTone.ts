import type { SoundTone } from './soundTone.type';

const ATTACK_S = 0.005;
const SILENCE = 0.0001;

export function scheduleTone(context: AudioContext, tone: SoundTone, startAt: number): void {
  const start = startAt + tone.offset;
  const end = start + tone.duration;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = tone.wave;
  oscillator.frequency.setValueAtTime(tone.frequency, start);
  if (tone.endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end);
  }

  gain.gain.setValueAtTime(SILENCE, start);
  gain.gain.exponentialRampToValueAtTime(tone.volume, start + ATTACK_S);
  gain.gain.exponentialRampToValueAtTime(SILENCE, end);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.onended = () => gain.disconnect();
  oscillator.start(start);
  oscillator.stop(end);
}
