import { loadFoldersDialog } from '@/features/organize/loadFoldersDialog';
import { loadTagsDialog } from '@/features/organize/loadTagsDialog';
import { loadSettingsPage } from '@/features/settings/loadSettingsPage';
import { loadLoginDialog } from '@/features/settings/login/loadLoginDialog';
import { loadAddWordDialog } from '@/features/words/loadAddWordDialog';
import { loadExportDialog } from '@/features/words/loadExportDialog';
import { loadImportDialog } from '@/features/words/loadImportDialog';

const LOADERS = [
  loadAddWordDialog,
  loadSettingsPage,
  loadFoldersDialog,
  loadTagsDialog,
  loadLoginDialog,
  loadImportDialog,
  loadExportDialog,
];

export function preloadDialogs(): () => void {
  const run = () => {
    for (const load of LOADERS) void load().catch(() => undefined);
  };
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(run, { timeout: 2000 });
    return () => window.cancelIdleCallback(handle);
  }
  const timer = window.setTimeout(run, 800);
  return () => window.clearTimeout(timer);
}
