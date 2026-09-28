import type { MergePlan } from './mergePlan.type';

export function isEmptyMergePlan(plan: MergePlan): boolean {
  return Object.values(plan).every((entries: unknown[]) => entries.length === 0);
}
