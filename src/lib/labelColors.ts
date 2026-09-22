import type { LabelColor } from '@/db/labelColor.type';
import { LABEL_PALETTE } from './labelPalette';

export const LABEL_COLORS = Object.keys(LABEL_PALETTE) as LabelColor[];
