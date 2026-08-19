import type { ParsedWordLine } from './parsedWordLine.type';
import { normalizeTerm } from './normalizeTerm';

const UNPADDED_DELIMITERS = ['=', ':', '\t'];
const PADDED_ONLY_DELIMITERS = ['-', '–', '—'];
const LEADING_LIST_MARKER = /^(?:[-–—*•·‣▪●○◦▸▹»>]+\s+|\d+[.)]\s+|\[[ xX]?\]\s+)/;
const LINE_SEPARATOR_CODE_POINTS = [0x2028, 0x2029];
const LINE_BREAKS = new RegExp(
  `\\r\\n|[\\n\\r${LINE_SEPARATOR_CODE_POINTS.map((code) => String.fromCodePoint(code)).join('')}]`,
);
const HAS_MEANINGFUL_CHARACTER = /[\p{L}\p{N}]/u;

type Delimiter = { index: number; length: number };

const DIGIT = /\d/;

function isTimeLikeColon(line: string, index: number): boolean {
  return line[index] === ':' && DIGIT.test(line[index - 1] ?? '') && DIGIT.test(line[index + 1] ?? '');
}

function findDelimiter(line: string): Delimiter | null {
  let best: Delimiter | null = null;

  for (const delimiter of UNPADDED_DELIMITERS) {
    let searchFrom = 0;
    while (true) {
      const index = line.indexOf(delimiter, searchFrom);
      if (index === -1) break;
      if (!isTimeLikeColon(line, index)) {
        if (best === null || index < best.index) {
          best = { index, length: delimiter.length };
        }
        break;
      }
      searchFrom = index + 1;
    }
  }

  for (const delimiter of PADDED_ONLY_DELIMITERS) {
    let searchFrom = 0;
    while (true) {
      const index = line.indexOf(delimiter, searchFrom);
      if (index === -1) break;
      const before = line[index - 1];
      const after = line[index + delimiter.length];
      if (before !== undefined && /\s/.test(before) && after !== undefined && /\s/.test(after)) {
        if (best === null || index < best.index) {
          best = { index, length: delimiter.length };
        }
        break;
      }
      searchFrom = index + 1;
    }
  }

  return best;
}

function splitLine(originalLine: string): ParsedWordLine | null {
  const withoutMarker = originalLine.replace(LEADING_LIST_MARKER, '');
  const delimiter = findDelimiter(withoutMarker);
  if (!delimiter) return null;

  const term = normalizeTerm(withoutMarker.slice(0, delimiter.index));
  const translation = normalizeTerm(withoutMarker.slice(delimiter.index + delimiter.length));

  if (!term || !translation || !HAS_MEANINGFUL_CHARACTER.test(term)) return null;

  return { term, translation };
}

export function parseWordLines(text: string): { valid: ParsedWordLine[]; invalidLines: string[] } {
  const valid: ParsedWordLine[] = [];
  const invalidLines: string[] = [];

  for (const rawLine of text.split(LINE_BREAKS)) {
    const line = rawLine.trim();
    if (!line) continue;

    const parsed = splitLine(line);
    if (parsed) {
      valid.push(parsed);
    } else {
      invalidLines.push(line);
    }
  }

  return { valid, invalidLines };
}
