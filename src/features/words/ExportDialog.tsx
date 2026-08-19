import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { db } from '@/db/db';
import { buildExportPayload } from '@/lib/buildExportPayload';
import { useTranslation } from '@/lib/useTranslation';
import { useUIStore } from '@/store/useUIStore';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function exportFileName(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `learn-words-export-${date}.json`;
}

function currentSettingsSnapshot() {
  const { theme, accentColor, language, phaseARepeats, phaseBRepeats } = useUIStore.getState();
  return { theme, accentColor, language, phaseARepeats, phaseBRepeats };
}

const OBJECT_URL_RELEASE_MS = 60_000;

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [includeWords, setIncludeWords] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = useTranslation();

  async function handleExport() {
    if (isExporting) return;
    setIsExporting(true);
    setFailed(false);
    try {
      const words = includeWords ? await db.words.toArray() : undefined;
      const settings = includeSettings ? currentSettingsSnapshot() : undefined;
      const payload = buildExportPayload({ words, settings });

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = exportFileName();
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_RELEASE_MS);

      onOpenChange(false);
    } catch {
      setFailed(true);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t.exportDialogTitle}</DialogTitle>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              aria-label={t.exportIncludeWords}
              checked={includeWords}
              onChange={(e) => setIncludeWords(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
            />
            {t.exportIncludeWords}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              aria-label={t.exportIncludeSettings}
              checked={includeSettings}
              onChange={(e) => setIncludeSettings(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
            />
            {t.exportIncludeSettings}
          </label>
          {failed && <p className="text-sm text-destructive">{t.exportFailed}</p>}
          <Button
            type="button"
            onClick={() => void handleExport()}
            disabled={(!includeWords && !includeSettings) || isExporting}
          >
            {t.exportConfirmButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
