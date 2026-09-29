import { useUIStore } from '@/store/useUIStore';
import { getAudioContext } from './getAudioContext';
import { scheduleTone } from './scheduleTone';
import { SOUND_CUES } from './soundCues';
import type { SoundCue } from './soundCue.type';

export function playSound(cue: SoundCue): void {
  if (!useUIStore.getState().soundEffects) return;
  const context = getAudioContext();
  if (!context) return;
  try {
    if (context.state !== 'running') context.resume().catch(() => undefined);
    const startAt = context.currentTime;
    for (const tone of SOUND_CUES[cue]) scheduleTone(context, tone, startAt);
  } catch {
    return;
  }
}
