import { safeGetItem } from '@/lib/safeGetItem';
import { safeSetItem } from '@/lib/safeSetItem';
import type { VocabDB } from '../VocabDB';
import { convertLegacySnapshot } from './convertLegacySnapshot';
import { hasAnyRecords } from './hasAnyRecords';
import { legacyMigrationMarker } from './legacyMigrationMarker';
import { readLegacyDatabase } from './readLegacyDatabase';

export async function migrateLegacyDatabase(db: VocabDB, legacyName: string): Promise<void> {
  const marker = legacyMigrationMarker(legacyName);
  if (safeGetItem(marker) != null) return;

  if (!(await hasAnyRecords(db))) {
    const snapshot = await readLegacyDatabase(legacyName);
    if (snapshot) {
      const converted = convertLegacySnapshot(snapshot);
      await db.transaction('rw', db.words, db.folders, db.tags, db.wordTags, async () => {
        await db.folders.bulkAdd(converted.folders);
        await db.tags.bulkAdd(converted.tags);
        await db.words.bulkAdd(converted.words);
        await db.wordTags.bulkAdd(converted.wordTags);
      });
    }
  }

  safeSetItem(marker, String(Date.now()));
}
