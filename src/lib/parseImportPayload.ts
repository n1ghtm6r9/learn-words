import type { Word } from '@/db/word.type';
import type { AccentColor } from '@/store/accentColor.type';
import type { Language } from '@/store/language.type';
import { ACCENT_PALETTE } from './accentPalette';
import { TRANSLATIONS } from './translations';
import { parsePositiveInt } from './parsePositiveInt';
import { MIN_PHASE_REPEATS, MAX_PHASE_REPEATS } from './phaseRepeatsRange';
import type { ExportPayload } from './exportPayload.type';
import type { ParsedImportPayload } from './parsedImportPayload.type';

const SUPPORTED_EXPORT_VERSION = 1;

type Settings = NonNullable<ExportPayload['settings']>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseWords(rawWords: unknown): ParsedImportPayload['words'] {
  if (!Array.isArray(rawWords)) return [];

  const words: ParsedImportPayload['words'] = [];
  for (const entry of rawWords) {
    if (typeof entry !== 'object' || entry === null) continue;
    const candidate = entry as Record<string, unknown>;
    if (!isNonEmptyString(candidate.term) || !isNonEmptyString(candidate.translation)) continue;
    words.push(candidate as Pick<Word, 'term' | 'translation'> & Partial<Word>);
  }
  return words;
}

function parseSettings(rawSettings: unknown): Partial<Settings> | null {
  if (typeof rawSettings !== 'object' || rawSettings === null) return null;
  const candidate = rawSettings as Record<string, unknown>;
  const settings: Partial<Settings> = {};

  if (candidate.theme === 'light' || candidate.theme === 'dark') {
    settings.theme = candidate.theme;
  }

  if (typeof candidate.accentColor === 'string' && Object.keys(ACCENT_PALETTE).includes(candidate.accentColor)) {
    settings.accentColor = candidate.accentColor as AccentColor;
  }

  if (typeof candidate.language === 'string' && Object.keys(TRANSLATIONS).includes(candidate.language)) {
    settings.language = candidate.language as Language;
  }

  const phaseARepeats = parsePositiveInt(String(candidate.phaseARepeats), MIN_PHASE_REPEATS, MAX_PHASE_REPEATS);
  if (phaseARepeats !== null) settings.phaseARepeats = phaseARepeats;

  const phaseBRepeats = parsePositiveInt(String(candidate.phaseBRepeats), MIN_PHASE_REPEATS, MAX_PHASE_REPEATS);
  if (phaseBRepeats !== null) settings.phaseBRepeats = phaseBRepeats;

  return Object.keys(settings).length > 0 ? settings : null;
}

export function parseImportPayload(jsonText: string): ParsedImportPayload {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    return { valid: false, words: [], settings: null };
  }

  if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
    return { valid: false, words: [], settings: null };
  }

  const payload = parsedJson as Record<string, unknown>;

  const hasUnsupportedVersion =
    payload.version !== undefined &&
    (typeof payload.version !== 'number' || payload.version > SUPPORTED_EXPORT_VERSION);
  if (hasUnsupportedVersion) {
    return { valid: false, words: [], settings: null };
  }

  return {
    valid: true,
    words: parseWords(payload.words),
    settings: parseSettings(payload.settings),
  };
}
