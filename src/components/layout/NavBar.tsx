import { motion } from 'motion/react';
import { BarChart3, House, ListChecks, Plus, SquareLibrary } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type Screen } from '@/store/useUIStore';

const ITEMS: { screen: Screen; label: string; icon: typeof House }[] = [
  { screen: 'home', label: 'Главная', icon: House },
  { screen: 'study', label: 'Учить', icon: SquareLibrary },
  { screen: 'add', label: 'Добавить', icon: Plus },
  { screen: 'words', label: 'Слова', icon: ListChecks },
  { screen: 'stats', label: 'Статистика', icon: BarChart3 },
];

export function NavBar() {
  const screen = useUIStore((s) => s.screen);
  const setScreen = useUIStore((s) => s.setScreen);

  return (
    <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-border bg-card/95 backdrop-blur px-1 py-1.5">
      {ITEMS.map((item) => {
        const active = screen === item.screen;
        const Icon = item.icon;
        return (
          <motion.button
            key={item.screen}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setScreen(item.screen)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[11px] transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                active && 'bg-primary/12',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            </span>
            {item.label}
          </motion.button>
        );
      })}
    </nav>
  );
}
