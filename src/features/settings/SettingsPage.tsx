import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { ThemeSection } from './ThemeSection';
import { AccentColorSection } from './AccentColorSection';
import { LanguageSection } from './LanguageSection';
import { usePhaseRepeatsField } from './usePhaseRepeatsField';

export function SettingsPage() {
  const phaseARepeats = useUIStore((s) => s.phaseARepeats);
  const setPhaseARepeats = useUIStore((s) => s.setPhaseARepeats);
  const phaseBRepeats = useUIStore((s) => s.phaseBRepeats);
  const setPhaseBRepeats = useUIStore((s) => s.setPhaseBRepeats);
  const t = useTranslation();

  const phaseA = usePhaseRepeatsField(phaseARepeats, setPhaseARepeats);
  const phaseB = usePhaseRepeatsField(phaseBRepeats, setPhaseBRepeats);

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-4">
        <ThemeSection />
        <AccentColorSection />
        <LanguageSection />
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <label className="flex flex-col gap-1.5 text-sm">
          {t.phaseARepeatsLabel}
          <Input
            aria-label={t.phaseARepeatsLabel}
            type="number"
            min={1}
            max={10}
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
            min={1}
            max={10}
            value={phaseB.draft}
            onChange={(e) => phaseB.setDraft(e.target.value)}
            onBlur={phaseB.commit}
            className="font-mono"
          />
        </label>
      </Card>
    </div>
  );
}
