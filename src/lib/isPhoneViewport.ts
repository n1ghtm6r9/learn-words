const DESKTOP_QUERY = '(min-width: 768px)';

export function isPhoneViewport(): boolean {
  return typeof window.matchMedia === 'function' && !window.matchMedia(DESKTOP_QUERY).matches;
}
