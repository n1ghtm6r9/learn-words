import { FolderTree, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APP_VERSION } from '@/lib/appVersion';
import { getCloud } from '@/cloud/getCloud';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { SettingsGroup } from './SettingsGroup';
import { AccountSection } from './AccountSection';
import { ThemeSection } from './ThemeSection';
import { AccentColorSection } from './AccentColorSection';
import { LanguageSection } from './LanguageSection';
import { StudyLanguageSection } from './StudyLanguageSection';
import { KeyboardSuggestionsSection } from './KeyboardSuggestionsSection';
import { SoundEffectsSection } from './SoundEffectsSection';
import { MIN_PHASE_REPEATS, MAX_PHASE_REPEATS } from '@/lib/phaseRepeatsRange';
import { MIN_REVIEW_LIMIT, MAX_REVIEW_LIMIT } from '@/lib/reviewLimitRange';
import { useNumberField } from './useNumberField';

export function SettingsPage() {
  const phaseARepeats = useUIStore((s) => s.phaseARepeats);
  const setPhaseARepeats = useUIStore((s) => s.setPhaseARepeats);
  const phaseBRepeats = useUIStore((s) => s.phaseBRepeats);
  const setPhaseBRepeats = useUIStore((s) => s.setPhaseBRepeats);
  const reviewLimit = useUIStore((s) => s.reviewLimit);
  const setReviewLimit = useUIStore((s) => s.setReviewLimit);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const setFoldersOpen = useUIStore((s) => s.setFoldersOpen);
  const setTagsOpen = useUIStore((s) => s.setTagsOpen);
  const t = useTranslation();
  const cloud = getCloud();

  const phaseA = useNumberField(phaseARepeats, setPhaseARepeats, MIN_PHASE_REPEATS, MAX_PHASE_REPEATS);
  const phaseB = useNumberField(phaseBRepeats, setPhaseBRepeats, MIN_PHASE_REPEATS, MAX_PHASE_REPEATS);
  const limit = useNumberField(reviewLimit, setReviewLimit, MIN_REVIEW_LIMIT, MAX_REVIEW_LIMIT);

  return (
    <div className="flex flex-col gap-3">
      {cloud && (
        <SettingsGroup title={t.accountLabel}>
          <AccountSection cloud={cloud} />
        </SettingsGroup>
      )}

      <SettingsGroup title={t.settingsAppearanceTitle}>
        <ThemeSection />
        <AccentColorSection />
      </SettingsGroup>

      <SettingsGroup title={t.settingsLanguagesTitle}>
        <LanguageSection />
        <StudyLanguageSection />
      </SettingsGroup>

      <SettingsGroup title={t.settingsLearningTitle}>
        <label className="flex flex-col gap-2 text-sm font-medium">
          {t.phaseARepeatsLabel}
          <Input
            aria-label={t.phaseARepeatsLabel}
            type="number"
            min={MIN_PHASE_REPEATS}
            max={MAX_PHASE_REPEATS}
            value={phaseA.draft}
            onChange={(e) => phaseA.setDraft(e.target.value)}
            onBlur={phaseA.commit}
            className="tabular-nums"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          {t.phaseBRepeatsLabel}
          <Input
            aria-label={t.phaseBRepeatsLabel}
            type="number"
            min={MIN_PHASE_REPEATS}
            max={MAX_PHASE_REPEATS}
            value={phaseB.draft}
            onChange={(e) => phaseB.setDraft(e.target.value)}
            onBlur={phaseB.commit}
            className="tabular-nums"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          {t.reviewLimitLabel}
          <Input
            aria-label={t.reviewLimitLabel}
            type="number"
            min={MIN_REVIEW_LIMIT}
            max={MAX_REVIEW_LIMIT}
            value={limit.draft}
            onChange={(e) => limit.setDraft(e.target.value)}
            onBlur={limit.commit}
            className="tabular-nums"
          />
        </label>

        <KeyboardSuggestionsSection />

        <SoundEffectsSection />

        <div className="flex flex-col gap-2 text-sm font-medium">
          {t.organizeTitle}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSettingsOpen(false);
                setFoldersOpen(true);
              }}
            >
              <FolderTree className="h-3.5 w-3.5" aria-hidden="true" />
              {t.foldersSectionTitle}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSettingsOpen(false);
                setTagsOpen(true);
              }}
            >
              <Hash className="h-3.5 w-3.5" aria-hidden="true" />
              {t.tagsSectionTitle}
            </Button>
          </div>
        </div>
      </SettingsGroup>

      <p className="pt-1 text-center text-xs text-muted-foreground tabular-nums">{t.appVersion(APP_VERSION)}</p>
    </div>
  );
}
