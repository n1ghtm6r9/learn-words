import type { AccentColor } from '@/store/accentColor.type';
import type { UiLanguage } from '@/i18n/uiLanguage.type';
import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { ACCENT_PALETTE } from './accentPalette';
import { STUDY_LANGUAGES } from '@/languages/studyLanguages';
import { UI_LANGUAGES } from '@/i18n/uiLanguages';
import { parsePositiveInt } from './parsePositiveInt';
import { MIN_PHASE_REPEATS, MAX_PHASE_REPEATS } from './phaseRepeatsRange';
import { MIN_REVIEW_LIMIT, MAX_REVIEW_LIMIT } from './reviewLimitRange';
import type { ExportPayload } from './exportPayload.type';
import type { ParsedImportPayload } from './parsedImportPayload.type';
import type { ImportedWord } from './importedWord.type';
import type { ImportedLabel } from './importedLabel.type';
import type { LabelColor } from '@/db/labelColor.type';
import { LABEL_COLORS } from './labelColors';

const SUPPORTED_EXPORT_VERSION = 4;

const INVALID_PAYLOAD: ParsedImportPayload = { valid: false, words: [], folders: [], tags: [], settings: null };

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
    const { folderId: _folderId, folder, tags, ...rest } = candidate;
    const word = rest as unknown as ImportedWord;
    if (isNonEmptyString(folder)) word.folder = folder;
    if (Array.isArray(tags)) {
      const names = tags.filter(isNonEmptyString);
      if (names.length > 0) word.tags = names;
    }
    words.push(word);
  }
  return words;
}

function parseLabels(rawLabels: unknown): ImportedLabel[] {
  if (!Array.isArray(rawLabels)) return [];

  const labels: ImportedLabel[] = [];
  for (const entry of rawLabels) {
    if (typeof entry !== 'object' || entry === null) continue;
    const candidate = entry as Record<string, unknown>;
    if (!isNonEmptyString(candidate.name)) continue;
    const label: ImportedLabel = { name: candidate.name };
    if (typeof candidate.color === 'string' && (LABEL_COLORS as string[]).includes(candidate.color)) {
      label.color = candidate.color as LabelColor;
    }
    if (typeof candidate.order === 'number' && Number.isFinite(candidate.order)) label.order = candidate.order;
    labels.push(label);
  }
  return labels;
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

  if (typeof candidate.language === 'string' && (UI_LANGUAGES as string[]).includes(candidate.language)) {
    settings.language = candidate.language as UiLanguage;
  }

  if (
    typeof candidate.studyLanguage === 'string' &&
    (STUDY_LANGUAGES as string[]).includes(candidate.studyLanguage)
  ) {
    settings.studyLanguage = candidate.studyLanguage as StudyLanguage;
  }

  const phaseARepeats = parsePositiveInt(String(candidate.phaseARepeats), MIN_PHASE_REPEATS, MAX_PHASE_REPEATS);
  if (phaseARepeats !== null) settings.phaseARepeats = phaseARepeats;

  const phaseBRepeats = parsePositiveInt(String(candidate.phaseBRepeats), MIN_PHASE_REPEATS, MAX_PHASE_REPEATS);
  if (phaseBRepeats !== null) settings.phaseBRepeats = phaseBRepeats;

  const reviewLimit = parsePositiveInt(String(candidate.reviewLimit), MIN_REVIEW_LIMIT, MAX_REVIEW_LIMIT);
  if (reviewLimit !== null) settings.reviewLimit = reviewLimit;

  return Object.keys(settings).length > 0 ? settings : null;
}

export function parseImportPayload(jsonText: string): ParsedImportPayload {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    return INVALID_PAYLOAD;
  }

  if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
    return INVALID_PAYLOAD;
  }

  const payload = parsedJson as Record<string, unknown>;

  const hasUnsupportedVersion =
    payload.version !== undefined &&
    (typeof payload.version !== 'number' || payload.version > SUPPORTED_EXPORT_VERSION);
  if (hasUnsupportedVersion) {
    return INVALID_PAYLOAD;
  }

  return {
    valid: true,
    words: parseWords(payload.words),
    folders: parseLabels(payload.folders),
    tags: parseLabels(payload.tags),
    settings: parseSettings(payload.settings),
  };
}
