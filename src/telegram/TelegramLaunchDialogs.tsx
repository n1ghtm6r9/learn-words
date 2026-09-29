import { LazyExportDialog } from '@/features/words/LazyExportDialog';
import { LazyImportDialog } from '@/features/words/LazyImportDialog';
import { fetchTelegramChatFile } from './fetchTelegramChatFile';
import { useTelegramStore } from './useTelegramStore';

export function TelegramLaunchDialogs() {
  const launch = useTelegramStore((s) => s.launch);
  const webApp = useTelegramStore((s) => s.webApp);
  const clearLaunch = useTelegramStore((s) => s.clearLaunch);
  if (!webApp || !launch) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) clearLaunch();
  };

  if (launch.action === 'export') {
    return <LazyExportDialog open onOpenChange={handleOpenChange} onSentToChat={() => webApp.close()} />;
  }

  const { ticket } = launch;
  return (
    <LazyImportDialog
      open
      onOpenChange={handleOpenChange}
      loadInitialFile={ticket === null ? undefined : () => fetchTelegramChatFile(ticket)}
    />
  );
}
