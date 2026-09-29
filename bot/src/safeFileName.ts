const FALLBACK_NAME = 'learn-words-export.json';
const MAX_LENGTH = 120;
const FORBIDDEN = '\\/:*?"<>|';

export function safeFileName(name: string): string {
  const cleaned = Array.from(name, (char) => (char < ' ' || FORBIDDEN.includes(char) ? '_' : char))
    .join('')
    .trim()
    .slice(0, MAX_LENGTH);
  if (!cleaned) return FALLBACK_NAME;
  return /\.json$/i.test(cleaned) ? cleaned : `${cleaned}.json`;
}
