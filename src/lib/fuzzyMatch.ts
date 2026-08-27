import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';
import { contract } from './contract';
import { withoutPrefix } from './withoutPrefix';

export type MatchVerdict = 'correct' | 'almost' | 'wrong';

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}

const TRAILING_PUNCTUATION = /[.,;:!?]+$/;
const APOSTROPHES = /[\u2018\u2019\u02bc\u0060\u00b4]/g;

function normalize(text: string): string {
  return text
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(APOSTROPHES, "'")
    .replace(TRAILING_PUNCTUATION, '');
}

const MINOR_ERROR_DISTANCE = 1;

const VERDICT_RANK: Record<MatchVerdict, number> = { wrong: 0, almost: 1, correct: 2 };

function sameWordForm(text: string, language: StudyLanguage): string {
  return contract(withoutPrefix(text, STUDY_LANGUAGE_PROFILES[language].identityPrefix), language);
}

function verdictFor(a: string, b: string): MatchVerdict {
  if (a === b) return 'correct';
  if (a.length === 0) return 'wrong';

  return levenshtein(a, b) === MINOR_ERROR_DISTANCE ? 'almost' : 'wrong';
}

function accuracyFor(a: string, b: string): number {
  if (a === b) return 1;
  if (b.length === 0) return a.length === 0 ? 1 : 0;

  return Math.max(0, 1 - levenshtein(a, b) / b.length);
}

export function matchAnswer(input: string, expected: string, language: StudyLanguage = 'en'): MatchVerdict {
  const a = normalize(input);
  const b = normalize(expected);

  const written = verdictFor(a, b);
  if (written === 'correct') return written;

  const contracted = verdictFor(sameWordForm(a, language), sameWordForm(b, language));
  return VERDICT_RANK[contracted] > VERDICT_RANK[written] ? contracted : written;
}

export function matchAccuracy(input: string, expected: string, language: StudyLanguage = 'en'): number {
  const a = normalize(input);
  const b = normalize(expected);

  return Math.max(accuracyFor(a, b), accuracyFor(sameWordForm(a, language), sameWordForm(b, language)));
}
