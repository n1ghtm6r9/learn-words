import type { LabelColor } from './labelColor.type';

export interface Folder {
  id?: number;
  name: string;
  color: LabelColor;
  order: number;
}
