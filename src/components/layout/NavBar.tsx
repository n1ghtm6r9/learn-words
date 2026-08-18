import { motion } from 'motion/react';
import { BookOpen, Layers, ListChecks, Settings } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import type { Screen } from '@/store/screen.type';

const ITEMS: { screen: Screen; label: string; icon: typeof Layers }[] = [
  { screen: 'newWords', label: 'Новые', icon: Layers },
  { screen: 'review', label: 'Повторение', icon: BookOpen },
  { screen: 'words', label: 'Слова', icon: ListChecks },
  { screen: 'settings', label: 'Настройки', icon: Settings },
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
            className={
              'flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[11px] transition-colors ' +
              (active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')
            }
          >
            <span
              className={
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors ' +
                (active ? 'bg-primary/12' : '')
              }
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
