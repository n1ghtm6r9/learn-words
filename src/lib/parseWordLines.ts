import type { ParsedWordLine } from './parsedWordLine.type';
import { normalizeTerm } from './normalizeTerm';

const UNPADDED_DELIMITERS = ['=', ':', '\t'];
const PADDED_ONLY_DELIMITERS = ['-', '–', '—'];
const LEADING_LIST_MARKER = /^(?:[-–—*•·‣▪]+\s+|\d+[.)]\s+)/;
const HAS_LETTER = /\p{L}/u;

function findDelimiter(line: string): { index: number; length: number } | null {
  let best: { index: number; length: number } | null = null;

  for (const delimiter of UNPADDED_DELIMITERS) {
    const index = line.indexOf(delimiter);
    if (index !== -1 && (best === null || index < best.index)) {
      best = { index, length: delimiter.length };
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

  if (!term || !translation || !HAS_LETTER.test(term)) return null;

  return { term, translation };
}

export function parseWordLines(text: string): { valid: ParsedWordLine[]; invalidLines: string[] } {
  const valid: ParsedWordLine[] = [];
  const invalidLines: string[] = [];

  for (const rawLine of text.split('\n')) {
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
