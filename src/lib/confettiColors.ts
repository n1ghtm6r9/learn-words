import { cssColorToHex } from './cssColorToHex';

const TOKENS = ['--primary', '--status-mastered', '--status-learning', '--foreground'] as const;
const FALLBACKS = ['#3f7d70', '#c9a24a', '#f5f1e4', '#2f6b5e'];

export function confettiColors(): string[] {
  const computed = getComputedStyle(document.documentElement);
  return TOKENS.map((token, index) =>
    cssColorToHex(computed.getPropertyValue(token), FALLBACKS[index]),
  );
}
