import { mergeAllLanguages } from '@/db/merge/mergeAllLanguages';
import { createCoalescedRunner } from '@/lib/createCoalescedRunner';
import { getCloud } from './getCloud';

export function startDuplicateMerging(): void {
  const cloud = getCloud();
  if (!cloud) return;

  const merge = createCoalescedRunner(mergeAllLanguages);
  cloud.events.syncComplete.subscribe(merge);
}
