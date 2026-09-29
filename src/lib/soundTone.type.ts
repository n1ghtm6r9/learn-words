export interface SoundTone {
  wave: OscillatorType;
  frequency: number;
  endFrequency?: number;
  offset: number;
  duration: number;
  volume: number;
}
