const INVISIBLE_CODE_POINTS = [0x200b, 0x2060, 0xfeff, 0xad];
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
const WHITESPACE = /\s/;

function stripWrappingQuotes(text: string): string {
  let start = 0;
  let end = text.length;

  while (end - start >= 2) {
    while (start < end && WHITESPACE.test(text[start])) start += 1;
    while (end > start && WHITESPACE.test(text[end - 1])) end -= 1;

    const opening = text[start];
    if (end - start < 2 || (opening !== '"' && opening !== "'") || text[end - 1] !== opening) break;

    start += 1;
    end -= 1;
  }

  return text.slice(start, end);
}

export function normalizeTerm(raw: string): string {
  const cleaned = raw
    .normalize('NFC')
    .replace(INVISIBLE_CHARS, '')
    .replace(NBSP_LIKE_CHARS, ' ')
    .replace(CURLY_DOUBLE_QUOTES, '"')
    .replace(CURLY_SINGLE_QUOTES, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return stripWrappingQuotes(cleaned).trim();
}
