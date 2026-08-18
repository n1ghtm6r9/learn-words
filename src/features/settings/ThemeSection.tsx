import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/useUIStore';

export function ThemeSection() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      Тема
      <div className="flex gap-2">
        <Button type="button" variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}>
          Светлая
        </Button>
        <Button type="button" variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}>
          Тёмная
        </Button>
      </div>
    </div>
  );
}
