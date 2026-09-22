import type { Table } from 'dexie';
import type { Folder } from './folder.type';
import type { Tag } from './tag.type';

export async function writeOrder(
  table: Table<Folder, number> | Table<Tag, number>,
  orderedIds: number[],
): Promise<void> {
  await table.db.transaction('rw', table, async () => {
    for (const [index, id] of orderedIds.entries()) {
      await table.update(id, { order: index + 1 });
    }
  });
}
