import { normalizeTerm } from '@/lib/normalizeTerm';
import type { LabelColor } from './labelColor.type';
import type { Folder } from './folder.type';

export function createFolder(rawName: string, color: LabelColor, order: number): Folder {
  return {
    name: normalizeTerm(rawName),
    color,
    order,
  };
}
