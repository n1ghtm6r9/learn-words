type AudioContextConstructor = typeof AudioContext;
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

let sharedContext: AudioContext | null = null;

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

export function getAudioContext(): AudioContext | null {
  if (sharedContext) return sharedContext;
  const AudioContextClass = findAudioContextConstructor();
  if (!AudioContextClass) return null;
  try {
    mixWithOtherAudio();
    sharedContext = new AudioContextClass();
  } catch {
    return null;
  }
  return sharedContext;
}
