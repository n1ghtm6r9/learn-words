export function readTranslateY(element: HTMLElement): number {
  const [, y = '0'] = getComputedStyle(element).translate.split(' ');
  return Number.parseFloat(y) || 0;
}
