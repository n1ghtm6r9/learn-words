export function commandOf(text: string | undefined): string | null {
  const match = /^\/([a-z]+)(?:@\w+)?(?:\s|$)/i.exec(text?.trim() ?? '');
  return match ? match[1].toLowerCase() : null;
}
