import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/ui/formAlert';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { applyImportPayload } from '@/lib/applyImportPayload';
import type { ImportResult } from '@/lib/importResult.type';
import { parseImportPayload } from '@/lib/parseImportPayload';
import type { ParsedImportPayload } from '@/lib/parsedImportPayload.type';
import { useTranslation } from '@/i18n/useTranslation';

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
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRequestId = useRef(0);
  const t = useTranslation();

  const hasWords =
    parsed != null && parsed.valid && parsed.words.length + parsed.folders.length + parsed.tags.length > 0;
  const hasSettings = parsed != null && parsed.valid && parsed.settings !== null;
  const canImport = (hasWords && importWords) || (hasSettings && importSettings);

  function resetState() {
    fileRequestId.current += 1;
    setParsed(null);
    setFileName(null);
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
    setFileName(file.name);

    const requestId = ++fileRequestId.current;
    const text = await file.text();
    if (requestId !== fileRequestId.current) return;

    const result = parseImportPayload(text);
    setParsed(result);
    setImportResult(null);
    setFailed(false);
    setImportWords(result.words.length + result.folders.length + result.tags.length > 0);
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
          <label className="flex flex-col gap-2 text-sm font-medium">
            {t.importFileLabel}
            <span className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-input bg-card px-2.5 py-2 transition-colors hover:bg-muted/50 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/20 md:min-h-11">
              <input
                type="file"
                accept="application/json"
                aria-label={t.importFileLabel}
                onChange={(e) => void handleFileChange(e)}
                className="sr-only"
              />
              <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-secondary px-3.5 text-sm font-medium text-foreground md:h-8 md:px-3">
                <FileUp className="h-4 w-4" aria-hidden="true" />
                {t.chooseFile}
              </span>
              <span className={`min-w-0 truncate text-sm font-normal ${fileName ? 'text-foreground' : 'text-muted-foreground'}`}>
                {fileName ?? t.noFileChosen}
              </span>
            </span>
          </label>

          {parsed && !parsed.valid && <FormAlert tone="error">{t.importError}</FormAlert>}

          {parsed && parsed.valid && (
            <>
              <p className="text-sm text-muted-foreground">
                {t.importSummary(parsed.words.length, parsed.settings !== null)}
              </p>
              {parsed.folders.length + parsed.tags.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t.importLabelsSummary(parsed.folders.length, parsed.tags.length)}
                </p>
              )}

              {hasWords && (
                <label className="flex min-h-11 items-center gap-3 text-sm md:min-h-8">
                  <input
                    type="checkbox"
                    aria-label={t.exportIncludeWords}
                    checked={importWords}
                    onChange={(e) => setImportWords(e.target.checked)}
                    className="h-5 w-5 shrink-0 rounded border border-input accent-primary md:h-4 md:w-4"
                  />
                  {t.exportIncludeWords}
                </label>
              )}

              {hasWords && importWords && (
                <label className="flex min-h-11 items-center gap-3 pl-8 text-sm md:min-h-8">
                  <input
                    type="checkbox"
                    aria-label={t.importReplaceExisting}
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="h-5 w-5 shrink-0 rounded border border-input accent-primary md:h-4 md:w-4"
                  />
                  {t.importReplaceExisting}
                </label>
              )}

              {hasSettings && (
                <label className="flex min-h-11 items-center gap-3 text-sm md:min-h-8">
                  <input
                    type="checkbox"
                    aria-label={t.exportIncludeSettings}
                    checked={importSettings}
                    onChange={(e) => setImportSettings(e.target.checked)}
                    className="h-5 w-5 shrink-0 rounded border border-input accent-primary md:h-4 md:w-4"
                  />
                  {t.exportIncludeSettings}
                </label>
              )}

              {failed && <FormAlert tone="error">{t.importFailed}</FormAlert>}

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
                <Button type="button" size="lg" onClick={() => handleOpenChange(false)} autoFocus>
                  {t.done}
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={() => void handleImport()} disabled={!canImport || isImporting}>
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
