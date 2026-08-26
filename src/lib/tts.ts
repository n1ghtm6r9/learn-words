export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function normalizeLang(lang: string): string {
  return lang.toLowerCase().replace('_', '-');
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices?.() ?? [];
  const wanted = normalizeLang(lang);
  const base = wanted.split('-')[0];

  const engineDefault = voices.find((voice) => voice.default);
  if (engineDefault && normalizeLang(engineDefault.lang).startsWith(base)) return undefined;

  const sameLanguage = voices.filter((voice) => normalizeLang(voice.lang).startsWith(base));
  const sameRegion = sameLanguage.filter((voice) => normalizeLang(voice.lang) === wanted);
  const candidates = sameRegion.length > 0 ? sameRegion : sameLanguage;

  return candidates.find((voice) => voice.default) ?? candidates[0];
}

export function speak(text: string, lang = 'en-US'): void {
  if (!isSpeechSupported()) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
