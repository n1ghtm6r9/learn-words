import type { AccentColor } from '@/store/accentColor.type';

interface AccentModeColors {
  primary: string;
  primaryForeground: string;
  ring: string;
}

interface AccentPreset {
  swatch: string;
  light: AccentModeColors;
  dark: AccentModeColors;
}

export const ACCENT_PALETTE: Record<AccentColor, AccentPreset> = {
  blue: {
    swatch: 'oklch(0.58 0.2 277)',
    light: { primary: 'oklch(0.5 0.22 277)', primaryForeground: 'oklch(0.985 0.005 275)', ring: 'oklch(0.5 0.22 277)' },
    dark: { primary: 'oklch(0.72 0.17 277)', primaryForeground: 'oklch(0.16 0.04 277)', ring: 'oklch(0.72 0.17 277)' },
  },
  green: {
    swatch: 'oklch(0.58 0.2 165)',
    light: { primary: 'oklch(0.5 0.22 165)', primaryForeground: 'oklch(0.985 0.005 275)', ring: 'oklch(0.5 0.22 165)' },
    dark: { primary: 'oklch(0.72 0.17 165)', primaryForeground: 'oklch(0.16 0.04 277)', ring: 'oklch(0.72 0.17 165)' },
  },
  purple: {
    swatch: 'oklch(0.58 0.2 335)',
    light: { primary: 'oklch(0.5 0.22 335)', primaryForeground: 'oklch(0.985 0.005 275)', ring: 'oklch(0.5 0.22 335)' },
    dark: { primary: 'oklch(0.72 0.17 335)', primaryForeground: 'oklch(0.16 0.04 277)', ring: 'oklch(0.72 0.17 335)' },
  },
  orange: {
    swatch: 'oklch(0.58 0.2 48)',
    light: { primary: 'oklch(0.5 0.22 48)', primaryForeground: 'oklch(0.985 0.005 275)', ring: 'oklch(0.5 0.22 48)' },
    dark: { primary: 'oklch(0.72 0.17 48)', primaryForeground: 'oklch(0.16 0.04 277)', ring: 'oklch(0.72 0.17 48)' },
  },
};
