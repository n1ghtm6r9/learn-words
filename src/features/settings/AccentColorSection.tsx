import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCENT_PALETTE } from '@/lib/accentPalette';
import { useTranslation } from '@/i18n/useTranslation';
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
    <div className="flex flex-col gap-2 text-sm font-medium">
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
                'flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-shadow',
                selected ? 'ring-foreground' : 'ring-transparent',
              )}
              style={{ backgroundColor: preset.swatch }}
            >
              {selected && <Check className="h-5 w-5 text-white" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
