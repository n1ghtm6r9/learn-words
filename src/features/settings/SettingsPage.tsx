import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { clamp } from '@/lib/clamp';
import { parsePositiveInt } from '@/lib/parsePositiveInt';
import { MIN_PHASE_REPEATS, MAX_PHASE_REPEATS } from '@/lib/phaseRepeatsRange';
import { useTranslation } from '@/lib/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { ThemeSection } from './ThemeSection';
import { AccentColorSection } from './AccentColorSection';
import { LanguageSection } from './LanguageSection';

export function SettingsPage() {
  const phaseARepeats = useUIStore((s) => s.phaseARepeats);
  const setPhaseARepeats = useUIStore((s) => s.setPhaseARepeats);
  const phaseBRepeats = useUIStore((s) => s.phaseBRepeats);
  const setPhaseBRepeats = useUIStore((s) => s.setPhaseBRepeats);
  const t = useTranslation();

  const [phaseAInput, setPhaseAInput] = useState(String(phaseARepeats));
  const [phaseBInput, setPhaseBInput] = useState(String(phaseBRepeats));

  function commitPhaseA() {
    const trimmed = phaseAInput.trim();
    const parsed = Number(trimmed);
    const value = trimmed !== '' && Number.isFinite(parsed)
      ? clamp(Math.round(parsed), MIN_PHASE_REPEATS, MAX_PHASE_REPEATS)
      : phaseARepeats;
    setPhaseARepeats(value);
    setPhaseAInput(String(value));
  }

  function commitPhaseB() {
    const trimmed = phaseBInput.trim();
    const parsed = Number(trimmed);
    const value = trimmed !== '' && Number.isFinite(parsed)
      ? clamp(Math.round(parsed), MIN_PHASE_REPEATS, MAX_PHASE_REPEATS)
      : phaseBRepeats;
    setPhaseBRepeats(value);
    setPhaseBInput(String(value));
  }

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
            value={phaseAInput}
            onChange={(e) => {
              setPhaseAInput(e.target.value);
              const value = parsePositiveInt(e.target.value, MIN_PHASE_REPEATS, MAX_PHASE_REPEATS);
              if (value != null) setPhaseARepeats(value);
            }}
            onBlur={commitPhaseA}
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
            value={phaseBInput}
            onChange={(e) => {
              setPhaseBInput(e.target.value);
              const value = parsePositiveInt(e.target.value, MIN_PHASE_REPEATS, MAX_PHASE_REPEATS);
              if (value != null) setPhaseBRepeats(value);
            }}
            onBlur={commitPhaseB}
            className="font-mono"
          />
        </label>
      </Card>
    </div>
  );
}
