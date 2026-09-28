export function duplicateRemap<T extends { id?: string }>(
  items: T[],
  identityOf: (item: T) => string,
  compare: (a: T, b: T) => number,
): Map<string, string> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (item.id == null) continue;
    const key = identityOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const remap = new Map<string, string>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const [keeper, ...duplicates] = [...group].sort(compare);
    for (const duplicate of duplicates) {
      remap.set(duplicate.id!, keeper.id!);
    }
  }
  return remap;
}
