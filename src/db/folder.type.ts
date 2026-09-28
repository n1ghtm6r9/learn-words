import type { LabelColor } from './labelColor.type';

export interface Folder {
  id?: string;
  name: string;
  color: LabelColor;
  order: number;
}
