import { SegmentedControl } from '@/components/ui/segmentedControl';
import { useTranslation } from '@/i18n/useTranslation';
import { playSound } from '@/lib/playSound';
import { useUIStore } from '@/store/useUIStore';

export function SoundEffectsSection() {
  const soundEffects = useUIStore((s) => s.soundEffects);
  const setSoundEffects = useUIStore((s) => s.setSoundEffects);
  const t = useTranslation();

  function handleChange(value: 'on' | 'off') {
    setSoundEffects(value === 'on');
    if (value === 'on') playSound('correct');
  }

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      {t.soundEffectsLabel}
      <SegmentedControl<'on' | 'off'>
        label={t.soundEffectsLabel}
        value={soundEffects ? 'on' : 'off'}
        onChange={handleChange}
        options={[
          { value: 'on', label: t.soundEffectsOn },
          { value: 'off', label: t.soundEffectsOff },
        ]}
      />
      <p className="text-sm font-normal text-muted-foreground">{t.soundEffectsHint}</p>
    </div>
  );
}
