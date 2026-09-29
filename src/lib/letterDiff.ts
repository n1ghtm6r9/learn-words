import type { DiffPart } from './diffPart.type';
import type { LetterDiff } from './letterDiff.type';

function lettersOf(text: string): string[] {
  return Array.from(text.normalize('NFC').trim());
}

function sameLetter(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function commonLengths(attempt: string[], expected: string[]): number[][] {
  const lengths = Array.from({ length: attempt.length + 1 }, () => new Array<number>(expected.length + 1).fill(0));

  for (let i = attempt.length - 1; i >= 0; i--) {
    for (let j = expected.length - 1; j >= 0; j--) {
      lengths[i][j] = sameLetter(attempt[i], expected[j])
        ? lengths[i + 1][j + 1] + 1
        : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }

  return lengths;
}

function groupLetters(letters: string[], changed: boolean[]): DiffPart[] {
  const parts: DiffPart[] = [];

  letters.forEach((letter, index) => {
    const last = parts[parts.length - 1];
    if (last && last.changed === changed[index]) {
      last.text += letter;
    } else {
      parts.push({ text: letter, changed: changed[index] });
    }
  });

  return parts;
}

export function letterDiff(attempt: string, expected: string): LetterDiff {
  const typed = lettersOf(attempt);
  const target = lettersOf(expected);
  const lengths = commonLengths(typed, target);
  const typedChanged = new Array<boolean>(typed.length).fill(true);
  const targetChanged = new Array<boolean>(target.length).fill(true);

  let i = 0;
  let j = 0;
  while (i < typed.length && j < target.length) {
    if (sameLetter(typed[i], target[j])) {
      typedChanged[i] = false;
      targetChanged[j] = false;
      i += 1;
      j += 1;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  return { attempt: groupLetters(typed, typedChanged), expected: groupLetters(target, targetChanged) };
}
