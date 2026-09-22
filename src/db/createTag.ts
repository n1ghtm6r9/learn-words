import { normalizeTerm } from '@/lib/normalizeTerm';
import type { LabelColor } from './labelColor.type';
import type { Tag } from './tag.type';

export function createTag(rawName: string, color: LabelColor, order: number): Tag {
  return {
    name: normalizeTerm(rawName),
    color,
    order,
  };
}
