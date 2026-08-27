export function withoutPrefix(text: string, prefix: RegExp | null): string {
  if (prefix === null) return text;

  const stripped = text.replace(prefix, '');
  return stripped === '' ? text : stripped;
}
