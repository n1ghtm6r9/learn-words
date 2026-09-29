import { motion } from 'motion/react';
import { BookOpen, Layers, ListChecks } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useKeyboardStore } from '@/store/useKeyboardStore';
import { useUIStore } from '@/store/useUIStore';
import type { Screen } from '@/store/screen.type';

export function NavBar() {
  const screen = useUIStore((s) => s.screen);
  const setScreen = useUIStore((s) => s.setScreen);
  const t = useTranslation();
  const keyboardOnScreen = useKeyboardStore((s) => s.onScreen);

  const items: { screen: Screen; label: string; icon: typeof Layers; hotkey: string }[] = [
    { screen: 'newWords', label: t.navNewWords, icon: Layers, hotkey: '1' },
    { screen: 'review', label: t.navReview, icon: BookOpen, hotkey: '2' },
    { screen: 'words', label: t.navWords, icon: ListChecks, hotkey: '3' },
  ];

  return (
    <nav
      inert={keyboardOnScreen}
      className={
        'fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border/60 bg-card/85 px-3 pt-2 pb-[calc(0.5rem+var(--safe-bottom))] backdrop-blur-xl md:inset-y-0 md:right-auto md:w-64 md:flex-col md:justify-start md:gap-1 md:border-t-0 md:border-r md:bg-card/90 md:px-3 md:pt-20 md:pb-4 ' +
        (keyboardOnScreen ? 'max-md:invisible' : '')
      }
    >
      {items.map((item) => {
        const active = screen === item.screen;
        const Icon = item.icon;
        return (
          <motion.button
            key={item.screen}
            type="button"
            whileTap={{ scale: 0.94 }}
            title={t.navHotkeyHint(item.label, item.hotkey)}
            aria-keyshortcuts={item.hotkey}
            onClick={() => setScreen(item.screen)}
            className={
              'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:min-h-11 md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 md:text-sm ' +
              (active ? 'font-semibold text-primary' : 'text-muted-foreground hover:text-foreground md:hover:bg-secondary')
            }
          >
            {active && (
              <motion.span
                layoutId="nav-active-row"
                aria-hidden="true"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 hidden rounded-xl bg-primary/10 md:block"
              />
            )}
            <span className="relative flex h-8 w-16 items-center justify-center md:h-auto md:w-auto">
              {active && (
                <motion.span
                  layoutId="nav-active-pill"
                  aria-hidden="true"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-primary/12 md:hidden"
                />
              )}
              <Icon className="relative h-[22px] w-[22px] md:h-5 md:w-5" strokeWidth={active ? 2.3 : 1.9} aria-hidden="true" />
            </span>
            <span className="relative">{item.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
