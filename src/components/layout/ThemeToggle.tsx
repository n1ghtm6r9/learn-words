import { useUIStore } from '@/store/useUIStore';

export function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <button type="button" onClick={toggleTheme} aria-label="Переключить тему">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
