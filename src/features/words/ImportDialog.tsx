import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { applyImportPayload } from '@/lib/applyImportPayload';
import type { ImportResult } from '@/lib/importResult.type';
import { parseImportPayload } from '@/lib/parseImportPayload';
import type { ParsedImportPayload } from '@/lib/parsedImportPayload.type';
import { useTranslation } from '@/lib/useTranslation';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [parsed, setParsed] = useState<ParsedImportPayload | null>(null);
  const [importWords, setImportWords] = useState(false);
  const [importSettings, setImportSettings] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [failed, setFailed] = useState(false);
  const fileRequestId = useRef(0);
  const t = useTranslation();

  const hasWords = parsed != null && parsed.valid && parsed.words.length > 0;
  const hasSettings = parsed != null && parsed.valid && parsed.settings !== null;
  const canImport = (hasWords && importWords) || (hasSettings && importSettings);

  function resetState() {
    fileRequestId.current += 1;
    setParsed(null);
    setImportWords(false);
    setImportSettings(false);
    setReplaceExisting(false);
    setImportResult(null);
    setFailed(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetState();
    onOpenChange(next);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const requestId = ++fileRequestId.current;
    const text = await file.text();
    if (requestId !== fileRequestId.current) return;

    const result = parseImportPayload(text);
    setParsed(result);
    setImportResult(null);
    setFailed(false);
    setImportWords(result.words.length > 0);
    setImportSettings(result.settings !== null);
  }

  async function handleImport() {
    if (!parsed || isImporting) return;
    setIsImporting(true);
    setFailed(false);
    try {
      const result = await applyImportPayload(parsed, {
        importWords: importWords && hasWords,
        importSettings: importSettings && hasSettings,
        replaceExisting,
      });
      setImportResult(result);
    } catch {
      setFailed(true);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>{t.importDialogTitle}</DialogTitle>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            {t.importFileLabel}
            <input
              type="file"
              accept="application/json"
              aria-label={t.importFileLabel}
              onChange={(e) => void handleFileChange(e)}
              className="text-sm file:mr-2 file:h-7 file:rounded-lg file:border-0 file:bg-secondary file:px-2.5 file:text-sm file:font-medium file:text-foreground"
            />
          </label>

          {parsed && !parsed.valid && <p className="text-sm text-destructive">{t.importError}</p>}

          {parsed && parsed.valid && (
            <>
              <p className="text-sm text-muted-foreground">
                {t.importSummary(parsed.words.length, parsed.settings !== null)}
              </p>

              {hasWords && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    aria-label={t.exportIncludeWords}
                    checked={importWords}
                    onChange={(e) => setImportWords(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
                  />
                  {t.exportIncludeWords}
                </label>
              )}

              {hasWords && importWords && (
                <label className="flex items-center gap-2 pl-6 text-sm">
                  <input
                    type="checkbox"
                    aria-label={t.importReplaceExisting}
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
                  />
                  {t.importReplaceExisting}
                </label>
              )}

              {hasSettings && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    aria-label={t.exportIncludeSettings}
                    checked={importSettings}
                    onChange={(e) => setImportSettings(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
                  />
                  {t.exportIncludeSettings}
                </label>
              )}

              {failed && <p className="text-sm text-destructive">{t.importFailed}</p>}

              {importResult && (
                <div aria-live="polite" className="flex flex-col gap-1 text-sm text-status-mastered">
                  <p>{t.importSuccess(importResult.importedCount)}</p>
                  {importResult.updatedCount > 0 && <p>{t.importUpdated(importResult.updatedCount)}</p>}
                  {importResult.skippedCount > 0 && (
                    <p className="text-muted-foreground">{t.importSkipped(importResult.skippedCount)}</p>
                  )}
                  {importResult.settingsApplied && (
                    <p className="text-muted-foreground">{t.importSettingsApplied}</p>
                  )}
                </div>
              )}

              {importResult ? (
                <Button type="button" onClick={() => handleOpenChange(false)} autoFocus>
                  {t.done}
                </Button>
              ) : (
                <Button type="button" onClick={() => void handleImport()} disabled={!canImport || isImporting}>
                  {t.importConfirmButton}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
