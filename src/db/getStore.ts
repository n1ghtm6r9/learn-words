import { CLOUD_DATABASE_URL } from '@/cloud/cloudDatabaseUrl';
import { LearnWordsDB } from './LearnWordsDB';
import { STORE_NAME } from './storeName';

let instance: LearnWordsDB | undefined;

export function getStore(): LearnWordsDB {
  instance ??= new LearnWordsDB(STORE_NAME, CLOUD_DATABASE_URL);
  return instance;
}
