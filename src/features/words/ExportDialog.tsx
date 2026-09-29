import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/ui/formAlert';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { pullCloudBeforeExport } from '@/cloud/pullCloudBeforeExport';
import { useDb } from '@/db/useDb';
import { buildExportPayload } from '@/lib/buildExportPayload';
import { useTranslation } from '@/i18n/useTranslation';
import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { useUIStore } from '@/store/useUIStore';
import { canSendToTelegramChat } from '@/telegram/canSendToTelegramChat';
import { sendFileToTelegramChat } from '@/telegram/sendFileToTelegramChat';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSentToChat?: () => void;
}

function exportFileName(studyLanguage: StudyLanguage): string {
  const date = new Date().toISOString().slice(0, 10);
  return `learn-words-${studyLanguage}-export-${date}.json`;
}

function currentSettingsSnapshot() {
  const { theme, accentColor, language, studyLanguage, phaseARepeats, phaseBRepeats, reviewLimit } =
    useUIStore.getState();
  return { theme, accentColor, language, studyLanguage, phaseARepeats, phaseBRepeats, reviewLimit };
}

const OBJECT_URL_RELEASE_MS = 60_000;

export function ExportDialog({ open, onOpenChange, onSentToChat }: ExportDialogProps) {
  const db = useDb();
  const studyLanguage = useUIStore((s) => s.studyLanguage);
  const [includeWords, setIncludeWords] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sentToChat, setSentToChat] = useState(false);
  const t = useTranslation();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSentToChat(false);
      setFailed(false);
    }
    onOpenChange(next);
  }

  async function handleExport() {
    if (isExporting) return;
    setIsExporting(true);
    setFailed(false);
    try {
      await pullCloudBeforeExport();
      const vocabulary = includeWords
        ? {
            words: await db.words.toArray(),
            folders: await db.folders.toArray(),
            tags: await db.tags.toArray(),
            links: await db.wordTags.toArray(),
          }
        : {};
      const settings = includeSettings ? currentSettingsSnapshot() : undefined;
      const payload = buildExportPayload({ ...vocabulary, settings });

      const fileName = exportFileName(studyLanguage);
      const json = JSON.stringify(payload, null, 2);

      if (canSendToTelegramChat()) {
        await sendFileToTelegramChat(fileName, json);
        setSentToChat(true);
        onSentToChat?.();
        return;
      }

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>{t.exportDialogTitle}</DialogTitle>
        <div className="flex flex-col gap-4">
          <label className="flex min-h-11 items-center gap-3 text-sm md:min-h-8">
            <input
              type="checkbox"
              aria-label={t.exportIncludeWords}
              checked={includeWords}
              onChange={(e) => setIncludeWords(e.target.checked)}
              className="h-5 w-5 shrink-0 rounded border border-input accent-primary md:h-4 md:w-4"
            />
            {t.exportIncludeWords}
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm md:min-h-8">
            <input
              type="checkbox"
              aria-label={t.exportIncludeSettings}
              checked={includeSettings}
              onChange={(e) => setIncludeSettings(e.target.checked)}
              className="h-5 w-5 shrink-0 rounded border border-input accent-primary md:h-4 md:w-4"
            />
            {t.exportIncludeSettings}
          </label>
          {failed && <FormAlert tone="error">{t.exportFailed}</FormAlert>}
          {sentToChat && (
            <p aria-live="polite" className="text-sm text-status-mastered">
              {t.exportSentToChat}
            </p>
          )}
          {sentToChat ? (
            <Button type="button" size="lg" onClick={() => handleOpenChange(false)} autoFocus>
              {t.done}
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={() => void handleExport()}
              disabled={(!includeWords && !includeSettings) || isExporting}
            >
              {canSendToTelegramChat() ? t.exportSendToChatButton : t.exportConfirmButton}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
