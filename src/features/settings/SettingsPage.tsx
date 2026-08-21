import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { ThemeSection } from './ThemeSection';
import { AccentColorSection } from './AccentColorSection';
import { LanguageSection } from './LanguageSection';
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
  const t = useTranslation();

  const phaseA = useNumberField(phaseARepeats, setPhaseARepeats, MIN_PHASE_REPEATS, MAX_PHASE_REPEATS);
  const phaseB = useNumberField(phaseBRepeats, setPhaseBRepeats, MIN_PHASE_REPEATS, MAX_PHASE_REPEATS);
  const limit = useNumberField(reviewLimit, setReviewLimit, MIN_REVIEW_LIMIT, MAX_REVIEW_LIMIT);

  return (
    <div className="flex flex-col divide-y divide-border">
      <div className="flex flex-col gap-4 pb-5">
        <ThemeSection />
        <AccentColorSection />
        <LanguageSection />
      </div>

      <div className="flex flex-col gap-4 pt-5">
        <label className="flex flex-col gap-1.5 text-sm">
          {t.phaseARepeatsLabel}
          <Input
            aria-label={t.phaseARepeatsLabel}
            type="number"
            min={MIN_PHASE_REPEATS}
            max={MAX_PHASE_REPEATS}
            value={phaseA.draft}
            onChange={(e) => phaseA.setDraft(e.target.value)}
            onBlur={phaseA.commit}
            className="font-mono"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          {t.phaseBRepeatsLabel}
          <Input
            aria-label={t.phaseBRepeatsLabel}
            type="number"
            min={MIN_PHASE_REPEATS}
            max={MAX_PHASE_REPEATS}
            value={phaseB.draft}
            onChange={(e) => phaseB.setDraft(e.target.value)}
            onBlur={phaseB.commit}
            className="font-mono"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          {t.reviewLimitLabel}
          <Input
            aria-label={t.reviewLimitLabel}
            type="number"
            min={MIN_REVIEW_LIMIT}
            max={MAX_REVIEW_LIMIT}
            value={limit.draft}
            onChange={(e) => limit.setDraft(e.target.value)}
            onBlur={limit.commit}
            className="font-mono"
          />
        </label>
      </div>
    </div>
  );
}
