import type { AccentColor } from '@/store/accentColor.type';
import type { Theme } from '@/store/theme.type';
import { ACCENT_PALETTE } from './accentPalette';

export function applyAccentColor(accentColor: AccentColor, theme: Theme): void {
  const colors = ACCENT_PALETTE[accentColor][theme];
  const root = document.documentElement.style;
  root.setProperty('--primary', colors.primary);
  root.setProperty('--primary-foreground', colors.primaryForeground);
  root.setProperty('--ring', colors.ring);
}
