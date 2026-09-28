import Dexie from 'dexie';
import { LegacyVocabDB } from './LegacyVocabDB';
import type { LegacySnapshot } from './legacySnapshot.type';

export async function readLegacyDatabase(name: string): Promise<LegacySnapshot | null> {
  if (!(await Dexie.exists(name))) return null;

  const legacy = new LegacyVocabDB(name);
  try {
    await legacy.open();
    const [words, folders, tags, wordTags] = await Promise.all([
      legacy.words.toArray(),
      legacy.folders.toArray(),
      legacy.tags.toArray(),
      legacy.wordTags.toArray(),
    ]);
    return { words, folders, tags, wordTags };
  } finally {
    legacy.close();
  }
}
