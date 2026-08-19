const INVISIBLE_CODE_POINTS = [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0xad];
const NBSP_CODE_POINTS = [0xa0, 0x202f, 0x2007];
const CURLY_DOUBLE_QUOTE_CODE_POINTS = [0x201c, 0x201d, 0x201e, 0xab, 0xbb];
const CURLY_SINGLE_QUOTE_CODE_POINTS = [0x2018, 0x2019, 0x201a];

function charClassPattern(codePoints: number[]): string {
  return codePoints.map((code) => String.fromCodePoint(code)).join('');
}

const INVISIBLE_CHARS = new RegExp(`[${charClassPattern(INVISIBLE_CODE_POINTS)}]`, 'g');
const NBSP_LIKE_CHARS = new RegExp(`[${charClassPattern(NBSP_CODE_POINTS)}]`, 'g');
const CURLY_DOUBLE_QUOTES = new RegExp(`[${charClassPattern(CURLY_DOUBLE_QUOTE_CODE_POINTS)}]`, 'g');
const CURLY_SINGLE_QUOTES = new RegExp(`[${charClassPattern(CURLY_SINGLE_QUOTE_CODE_POINTS)}]`, 'g');
const WRAPPING_QUOTES = /^["']+|["']+$/g;

export function normalizeTerm(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(INVISIBLE_CHARS, '')
    .replace(NBSP_LIKE_CHARS, ' ')
    .replace(CURLY_DOUBLE_QUOTES, '"')
    .replace(CURLY_SINGLE_QUOTES, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(WRAPPING_QUOTES, '')
    .trim();
}
