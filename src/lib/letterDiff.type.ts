import type { DiffPart } from './diffPart.type';

export interface LetterDiff {
  attempt: DiffPart[];
  expected: DiffPart[];
}
