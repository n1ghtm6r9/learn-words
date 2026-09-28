import { Cloud, CloudOff, RefreshCw, type LucideIcon } from 'lucide-react';
import type { SyncStatus } from './syncStatus.type';

export const SYNC_STATUS_ICON: Record<SyncStatus, LucideIcon> = {
  synced: Cloud,
  syncing: RefreshCw,
  offline: CloudOff,
  error: CloudOff,
};
