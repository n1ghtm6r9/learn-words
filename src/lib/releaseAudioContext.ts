import { sharedAudio } from './sharedAudio';

export function releaseAudioContext(): void {
  const { context } = sharedAudio;
  sharedAudio.context = null;
  context?.close().catch(() => undefined);
}
