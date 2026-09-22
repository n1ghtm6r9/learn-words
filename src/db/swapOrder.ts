import type { Table } from 'dexie';
import type { Folder } from './folder.type';
import type { Tag } from './tag.type';

export async function swapOrder(table: Table<Folder, number> | Table<Tag, number>, aId: number, bId: number): Promise<void> {
  await table.db.transaction('rw', table, async () => {
    const [a, b] = await Promise.all([table.get(aId), table.get(bId)]);
    if (!a || !b) return;

    await table.update(aId, { order: b.order });
    await table.update(bId, { order: a.order });
  });
}
