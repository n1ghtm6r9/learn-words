import type { ParsedWordLine } from './parsedWordLine.type';

const DELIMITERS = ['-', '–', '—', '=', ':', '\t'];

function splitLine(line: string): ParsedWordLine | null {
  let delimiterIndex = -1;
  let delimiterLength = 1;

  for (const delimiter of DELIMITERS) {
    const index = line.indexOf(delimiter);
    if (index !== -1 && (delimiterIndex === -1 || index < delimiterIndex)) {
      delimiterIndex = index;
      delimiterLength = delimiter.length;
    }
  }

  if (delimiterIndex === -1) return null;

  const term = line.slice(0, delimiterIndex).trim();
  const translation = line.slice(delimiterIndex + delimiterLength).trim();

  if (!term || !translation) return null;

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
