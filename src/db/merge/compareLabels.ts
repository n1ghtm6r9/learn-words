import { compareIds } from './compareIds';

export function compareLabels(a: { id?: string; order: number }, b: { id?: string; order: number }): number {
  return a.order - b.order || compareIds(a, b);
}
