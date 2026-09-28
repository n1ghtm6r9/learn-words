import type { LabelColor } from './labelColor.type';

export interface Tag {
  id?: string;
  name: string;
  color: LabelColor;
  order: number;
}
