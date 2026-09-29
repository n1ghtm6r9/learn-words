import { cssColorToHex } from './cssColorToHex';

const FALLBACK = '#f1f2fa';

export function applyThemeColorMeta(): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const background = getComputedStyle(document.documentElement).getPropertyValue('--background');
  meta.setAttribute('content', cssColorToHex(background, FALLBACK));
}
