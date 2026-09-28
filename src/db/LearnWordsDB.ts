import Dexie from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import { STUDY_LANGUAGES } from '@/languages/studyLanguages';
import { assignMissingId } from './assignMissingId';
import { languageSchema } from './languageSchema';
import { SYNCED_TABLE_NAMES } from './syncedTableNames';

export class LearnWordsDB extends Dexie {
  isBlocked = false;

  constructor(name: string, databaseUrl?: string) {
    super(name, { addons: databaseUrl ? [dexieCloud] : [] });

    this.on('blocked', () => {
      this.isBlocked = true;
    });

    this.version(1).stores(Object.assign({}, ...STUDY_LANGUAGES.map(languageSchema)));

    for (const tableName of SYNCED_TABLE_NAMES) {
      this.table(tableName).hook('creating', assignMissingId);
    }

    if (databaseUrl) {
      this.cloud.configure({
        databaseUrl,
        requireAuth: false,
        customLoginGui: true,
      });
    }
  }
}
