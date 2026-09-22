import type { LabelColor } from './labelColor.type';

export interface Tag {
  id?: number;
  name: string;
  color: LabelColor;
  order: number;
}
