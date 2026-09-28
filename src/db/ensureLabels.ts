import type { Table } from 'dexie';
import type { ImportedLabel } from '@/lib/importedLabel.type';
import { LABEL_COLORS } from '@/lib/labelColors';
import { createFolder } from './createFolder';
import type { Folder } from './folder.type';
import { labelIdentityKey } from './merge/labelIdentityKey';
import type { Tag } from './tag.type';

function orderOf(label: ImportedLabel): number {
  return label.order ?? Number.MAX_SAFE_INTEGER;
}

export async function ensureLabels(
  table: Table<Folder, string> | Table<Tag, string>,
  wanted: ImportedLabel[],
): Promise<Map<string, string>> {
  const existing = await table.toArray();
  const ids = new Map(existing.map((label) => [labelIdentityKey(label.name), label.id!]));
  let order = existing.reduce((highest, label) => Math.max(highest, label.order), 0);

  for (const label of [...wanted].sort((a, b) => orderOf(a) - orderOf(b))) {
    const key = labelIdentityKey(label.name);
    if (key === '' || ids.has(key)) continue;
    order += 1;
    const color = label.color ?? LABEL_COLORS[ids.size % LABEL_COLORS.length];
    ids.set(key, await table.add(createFolder(label.name, color, order)));
  }

  return ids;
}
