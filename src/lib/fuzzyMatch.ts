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

function normalize(text: string): string {
  return text.normalize('NFC').trim().toLowerCase().replace(TRAILING_PUNCTUATION, '');
}

const MINOR_ERROR_DISTANCE = 1;

export function matchAnswer(input: string, expected: string): MatchVerdict {
  const a = normalize(input);
  const b = normalize(expected);

  if (a === b) return 'correct';
  if (a.length === 0) return 'wrong';

  const inputWords = a.split(/\s+/);
  const expectedWords = b.split(/\s+/);

  if (inputWords.length !== expectedWords.length) return 'wrong';

  let mismatchedWordCount = 0;
  let mismatchedWordDistance = 0;

  for (let i = 0; i < expectedWords.length; i++) {
    if (inputWords[i] === expectedWords[i]) continue;
    mismatchedWordCount += 1;
    mismatchedWordDistance = levenshtein(inputWords[i], expectedWords[i]);
  }

  const isMinorError = mismatchedWordCount === 1 && mismatchedWordDistance === MINOR_ERROR_DISTANCE;
  return isMinorError ? 'almost' : 'wrong';
}
