import { useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';

export function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <button type="button" onClick={toggleTheme} aria-label="Переключить тему">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
