import type { ContractionRule } from '../contractionRule.type';

export const SPANISH_CONTRACTIONS: readonly ContractionRule[] = [
  [/\ba\s+el\b/gi, 'al'],
  [/\bde\s+el\b/gi, 'del'],
];
