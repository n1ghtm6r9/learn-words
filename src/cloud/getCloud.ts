import { getStore } from '@/db/getStore';
import type { CloudApi } from './cloudApi.type';
import { CLOUD_DATABASE_URL } from './cloudDatabaseUrl';

export function getCloud(): CloudApi | null {
  return CLOUD_DATABASE_URL ? getStore().cloud : null;
}
