import { useCallback } from 'react';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';
import { useUIStore } from '@/store/useUIStore';
import { speak } from './tts';

export function useSpeak(): (text: string) => void {
  const studyLanguage = useUIStore((s) => s.studyLanguage);

  return useCallback(
    (text: string) => speak(text, STUDY_LANGUAGE_PROFILES[studyLanguage].speechLang),
    [studyLanguage],
  );
}
