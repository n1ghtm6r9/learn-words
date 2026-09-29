import { motion } from 'motion/react';
import { BookOpen, Layers, ListChecks } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import type { Screen } from '@/store/screen.type';

export function NavBar() {
  const screen = useUIStore((s) => s.screen);
  const setScreen = useUIStore((s) => s.setScreen);
  const t = useTranslation();

  const items: { screen: Screen; label: string; icon: typeof Layers }[] = [
    { screen: 'newWords', label: t.navNewWords, icon: Layers },
    { screen: 'review', label: t.navReview, icon: BookOpen },
    { screen: 'words', label: t.navWords, icon: ListChecks },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border/60 bg-card/90 px-3 pt-2 pb-[calc(0.5rem+var(--safe-bottom))] backdrop-blur-xl md:inset-y-0 md:right-auto md:w-64 md:flex-col md:justify-start md:gap-1 md:border-t-0 md:border-r md:bg-card md:px-3 md:pt-20 md:pb-4">
      {items.map((item) => {
        const active = screen === item.screen;
        const Icon = item.icon;
        return (
          <motion.button
            key={item.screen}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setScreen(item.screen)}
            className={
              'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 text-xs font-medium transition-colors md:min-h-11 md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 md:text-sm ' +
              (active ? 'text-primary md:bg-primary/10' : 'text-muted-foreground hover:text-foreground md:hover:bg-secondary')
            }
          >
            <span
              className={
                'flex h-8 w-14 items-center justify-center rounded-full transition-colors md:h-auto md:w-auto ' +
                (active ? 'bg-primary/15 md:bg-transparent' : '')
              }
            >
              <Icon className="h-[22px] w-[22px] md:h-5 md:w-5" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            </span>
            {item.label}
          </motion.button>
        );
      })}
    </nav>
  );
}
