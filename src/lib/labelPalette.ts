import type { LabelColor } from '@/db/labelColor.type';

export const LABEL_PALETTE: Record<LabelColor, string> = {
  red: 'oklch(0.62 0.19 25)',
  orange: 'oklch(0.68 0.16 55)',
  amber: 'oklch(0.75 0.15 82)',
  lime: 'oklch(0.72 0.17 130)',
  green: 'oklch(0.62 0.15 150)',
  teal: 'oklch(0.63 0.11 185)',
  cyan: 'oklch(0.67 0.11 220)',
  blue: 'oklch(0.58 0.15 255)',
  indigo: 'oklch(0.55 0.17 280)',
  purple: 'oklch(0.58 0.17 305)',
  pink: 'oklch(0.65 0.18 350)',
  slate: 'oklch(0.58 0.03 260)',
};
