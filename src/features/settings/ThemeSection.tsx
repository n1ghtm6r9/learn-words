import { SegmentedControl } from '@/components/ui/segmentedControl';
import { useTranslation } from '@/i18n/useTranslation';
import type { Theme } from '@/store/theme.type';
import { useUIStore } from '@/store/useUIStore';

export function ThemeSection() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      {t.themeLabel}
      <SegmentedControl<Theme>
        label={t.themeLabel}
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'light', label: t.themeLight },
          { value: 'dark', label: t.themeDark },
        ]}
      />
    </div>
  );
}
