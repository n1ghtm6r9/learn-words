import { useCallback } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { SPEECH_LANG } from './speechLang';
import { speak } from './tts';

export function useSpeak(): (text: string) => void {
  const studyLanguage = useUIStore((s) => s.studyLanguage);

  return useCallback((text: string) => speak(text, SPEECH_LANG[studyLanguage]), [studyLanguage]);
}
