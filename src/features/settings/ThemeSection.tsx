import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';

export function ThemeSection() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      {t.themeLabel}
      <div className="flex gap-2">
        <Button type="button" variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}>
          {t.themeLight}
        </Button>
        <Button type="button" variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}>
          {t.themeDark}
        </Button>
      </div>
    </div>
  );
}
