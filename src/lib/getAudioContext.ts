import { releaseAudioContext } from './releaseAudioContext';
import { sharedAudio } from './sharedAudio';

type AudioContextConstructor = typeof AudioContext;
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

function findAudioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const legacyWindow = window as Window & { webkitAudioContext?: AudioContextConstructor };
  return window.AudioContext ?? legacyWindow.webkitAudioContext;
}

function mixWithOtherAudio(): void {
  const audioSession = (navigator as AudioSessionNavigator).audioSession;
  if (!audioSession) return;
  try {
    audioSession.type = 'ambient';
  } catch {
    return;
  }
}

function canResume(context: AudioContext): boolean {
  return context.state === 'running' || context.state === 'suspended';
}

function releaseWhenHidden(): void {
  if (document.visibilityState === 'hidden') releaseAudioContext();
}

export function getAudioContext(): AudioContext | null {
  if (sharedAudio.context && canResume(sharedAudio.context)) return sharedAudio.context;
  releaseAudioContext();
  const AudioContextClass = findAudioContextConstructor();
  if (!AudioContextClass) return null;
  try {
    mixWithOtherAudio();
    sharedAudio.context = new AudioContextClass();
  } catch {
    return null;
  }
  document.addEventListener('visibilitychange', releaseWhenHidden);
  return sharedAudio.context;
}
