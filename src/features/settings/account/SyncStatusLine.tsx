import type { SyncState } from 'dexie-cloud-addon';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import type { SyncStatus } from './syncStatus.type';
import { syncStatusOf } from './syncStatusOf';
import { SYNC_STATUS_ICON } from './syncStatusIcon';

interface SyncStatusLineProps {
  phase: SyncState['phase'] | undefined;
}

export function SyncStatusLine({ phase }: SyncStatusLineProps) {
  const t = useTranslation();
  const status = syncStatusOf(phase);
  const Icon = SYNC_STATUS_ICON[status];

  const statusLabel: Record<SyncStatus, string> = {
    synced: t.syncStatusSynced,
    syncing: t.syncStatusSyncing,
    offline: t.syncStatusOffline,
    error: t.syncStatusError,
  };

  return (
    <span className={cn('flex items-center gap-1 text-xs', status === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
      <Icon className={cn('h-3 w-3 shrink-0', status === 'syncing' && 'animate-spin')} aria-hidden="true" />
      {statusLabel[status]}
    </span>
  );
}
