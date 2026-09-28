import type { SyncState } from 'dexie-cloud-addon';
import type { SyncStatus } from './syncStatus.type';

export function syncStatusOf(phase: SyncState['phase'] | undefined): SyncStatus {
  switch (phase) {
    case 'in-sync':
      return 'synced';
    case 'offline':
      return 'offline';
    case 'error':
      return 'error';
    default:
      return 'syncing';
  }
}
