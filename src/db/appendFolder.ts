import { LABEL_COLORS } from '@/lib/labelColors';
import type { LabelColor } from './labelColor.type';
import { createFolder } from './createFolder';
import type { VocabDB } from './VocabDB';

export async function appendFolder(db: VocabDB, name: string, color?: LabelColor): Promise<number> {
  return db.transaction('rw', db.folders, async () => {
    const last = await db.folders.orderBy('order').last();
    const picked = color ?? LABEL_COLORS[(await db.folders.count()) % LABEL_COLORS.length];
    return db.folders.add(createFolder(name, picked, (last?.order ?? 0) + 1));
  });
}
