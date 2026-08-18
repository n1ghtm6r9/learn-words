import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/store/useUIStore';
import { ThemeSection } from './ThemeSection';
import { AccentColorSection } from './AccentColorSection';

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10 ? parsed : null;
}

export function SettingsPage() {
  const phaseARepeats = useUIStore((s) => s.phaseARepeats);
  const setPhaseARepeats = useUIStore((s) => s.setPhaseARepeats);
  const phaseBRepeats = useUIStore((s) => s.phaseBRepeats);
  const setPhaseBRepeats = useUIStore((s) => s.setPhaseBRepeats);

  const [phaseAInput, setPhaseAInput] = useState(String(phaseARepeats));
  const [phaseBInput, setPhaseBInput] = useState(String(phaseBRepeats));

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-4">
        <ThemeSection />
        <AccentColorSection />
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Повторов в фазе узнавания (слово + перевод)
          <Input
            aria-label="Повторов в фазе узнавания (слово + перевод)"
            type="number"
            min={1}
            max={10}
            value={phaseAInput}
            onChange={(e) => {
              setPhaseAInput(e.target.value);
              const value = parsePositiveInt(e.target.value);
              if (value != null) setPhaseARepeats(value);
            }}
            className="font-mono"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Повторов в фазе вспоминания (только перевод)
          <Input
            aria-label="Повторов в фазе вспоминания (только перевод)"
            type="number"
            min={1}
            max={10}
            value={phaseBInput}
            onChange={(e) => {
              setPhaseBInput(e.target.value);
              const value = parsePositiveInt(e.target.value);
              if (value != null) setPhaseBRepeats(value);
            }}
            className="font-mono"
          />
        </label>
      </Card>
    </div>
  );
}
