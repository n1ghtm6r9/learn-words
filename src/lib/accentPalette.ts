import type { AccentColor } from '@/store/accentColor.type';

interface AccentModeColors {
  primary: string;
  primaryForeground: string;
  ring: string;
}

interface AccentPreset {
  label: string;
  swatch: string;
  light: AccentModeColors;
  dark: AccentModeColors;
}

export const ACCENT_PALETTE: Record<AccentColor, AccentPreset> = {
  blue: {
    label: 'Синий',
    swatch: 'oklch(0.55 0.09 250)',
    light: { primary: 'oklch(0.42 0.08 250)', primaryForeground: 'oklch(0.98 0.01 95)', ring: 'oklch(0.42 0.08 250)' },
    dark: { primary: 'oklch(0.68 0.1 250)', primaryForeground: 'oklch(0.15 0.02 265)', ring: 'oklch(0.68 0.1 250)' },
  },
  green: {
    label: 'Зелёный',
    swatch: 'oklch(0.55 0.09 175)',
    light: { primary: 'oklch(0.42 0.08 175)', primaryForeground: 'oklch(0.98 0.01 95)', ring: 'oklch(0.42 0.08 175)' },
    dark: { primary: 'oklch(0.68 0.1 175)', primaryForeground: 'oklch(0.15 0.02 265)', ring: 'oklch(0.68 0.1 175)' },
  },
  purple: {
    label: 'Фиолетовый',
    swatch: 'oklch(0.55 0.09 310)',
    light: { primary: 'oklch(0.42 0.08 310)', primaryForeground: 'oklch(0.98 0.01 95)', ring: 'oklch(0.42 0.08 310)' },
    dark: { primary: 'oklch(0.68 0.1 310)', primaryForeground: 'oklch(0.15 0.02 265)', ring: 'oklch(0.68 0.1 310)' },
  },
  orange: {
    label: 'Оранжевый',
    swatch: 'oklch(0.55 0.09 55)',
    light: { primary: 'oklch(0.42 0.08 55)', primaryForeground: 'oklch(0.98 0.01 95)', ring: 'oklch(0.42 0.08 55)' },
    dark: { primary: 'oklch(0.68 0.1 55)', primaryForeground: 'oklch(0.15 0.02 265)', ring: 'oklch(0.68 0.1 55)' },
  },
};
