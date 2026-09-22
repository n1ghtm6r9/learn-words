import { LABEL_COLORS } from '@/lib/labelColors';
import type { LabelColor } from './labelColor.type';
import { createTag } from './createTag';
import type { VocabDB } from './VocabDB';

export async function appendTag(db: VocabDB, name: string, color?: LabelColor): Promise<number> {
  return db.transaction('rw', db.tags, async () => {
    const last = await db.tags.orderBy('order').last();
    const picked = color ?? LABEL_COLORS[(await db.tags.count()) % LABEL_COLORS.length];
    return db.tags.add(createTag(name, picked, (last?.order ?? 0) + 1));
  });
}
