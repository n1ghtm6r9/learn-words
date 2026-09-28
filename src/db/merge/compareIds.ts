export function compareIds(a: { id?: string }, b: { id?: string }): number {
  const left = a.id ?? '';
  const right = b.id ?? '';
  return left < right ? -1 : left > right ? 1 : 0;
}
