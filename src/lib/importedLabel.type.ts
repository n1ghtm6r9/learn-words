import type { LabelColor } from '@/db/labelColor.type';

export interface ImportedLabel {
  name: string;
  color?: LabelColor;
  order?: number;
}
