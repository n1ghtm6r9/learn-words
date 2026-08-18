import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCENT_PALETTE } from '@/lib/accentPalette';
import { useTranslation } from '@/lib/useTranslation';
import type { AccentColor } from '@/store/accentColor.type';
import { useUIStore } from '@/store/useUIStore';

const ACCENT_OPTIONS = Object.keys(ACCENT_PALETTE) as AccentColor[];

export function AccentColorSection() {
  const accentColor = useUIStore((s) => s.accentColor);
  const setAccentColor = useUIStore((s) => s.setAccentColor);
  const t = useTranslation();

  const accentLabel: Record<AccentColor, string> = {
    blue: t.accentBlue,
    green: t.accentGreen,
    purple: t.accentPurple,
    orange: t.accentOrange,
  };

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {t.accentColorLabel}
      <div className="flex gap-2.5">
        {ACCENT_OPTIONS.map((color) => {
          const preset = ACCENT_PALETTE[color];
          const selected = accentColor === color;
          return (
            <button
              key={color}
              type="button"
              aria-label={accentLabel[color]}
              aria-pressed={selected}
              onClick={() => setAccentColor(color)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-shadow',
                selected ? 'ring-foreground' : 'ring-transparent',
              )}
              style={{ backgroundColor: preset.swatch }}
            >
              {selected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
