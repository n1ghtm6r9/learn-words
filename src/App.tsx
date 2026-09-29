import { Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Plus, Settings as SettingsIcon } from 'lucide-react';
import { NavBar } from '@/components/layout/NavBar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { NewWordsSession } from '@/features/newWords/NewWordsSession';
import { ReviewSession } from '@/features/review/ReviewSession';
import { LazyAddWordDialog } from '@/features/words/lazyAddWordDialog';
import { WordList } from '@/features/words/WordList';
import { LazyFoldersDialog } from '@/features/organize/lazyFoldersDialog';
import { LazyTagsDialog } from '@/features/organize/lazyTagsDialog';
import { LazySettingsPage } from '@/features/settings/lazySettingsPage';
import { LazyLoginDialog } from '@/features/settings/login/lazyLoginDialog';
import { getCloud } from '@/cloud/getCloud';
import { TelegramLaunchDialogs } from '@/telegram/TelegramLaunchDialogs';
import { useKeyboardStore } from '@/store/useKeyboardStore';
import { useUIStore } from '@/store/useUIStore';
import { applyAccentColor } from '@/lib/applyAccentColor';
import { STUDY_LANGUAGE_PROFILES } from '@/languages/studyLanguageProfiles';
import { useTranslation } from '@/i18n/useTranslation';
import { useGlobalHotkeys } from '@/lib/useGlobalHotkeys';
import { useKeepFocusedFormAboveKeyboard } from '@/lib/useKeepFocusedFormAboveKeyboard';
import { preloadDialogs } from '@/lib/preloadDialogs';
import { applyThemeColorMeta } from '@/lib/applyThemeColorMeta';
import { DialogBodySkeleton } from '@/components/ui/dialogBodySkeleton';

const SCREEN_ORDER = ['newWords', 'review', 'words'];

function App() {
  const screen = useUIStore((s) => s.screen);
  const theme = useUIStore((s) => s.theme);
  const language = useUIStore((s) => s.language);
  const studyLanguage = useUIStore((s) => s.studyLanguage);
  const accentColor = useUIStore((s) => s.accentColor);
  const addWordOpen = useUIStore((s) => s.addWordOpen);
  const setAddWordOpen = useUIStore((s) => s.setAddWordOpen);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const selectingWords = useUIStore((s) => s.selectingWords);
  const foldersOpen = useUIStore((s) => s.foldersOpen);
  const setFoldersOpen = useUIStore((s) => s.setFoldersOpen);
  const tagsOpen = useUIStore((s) => s.tagsOpen);
  const setTagsOpen = useUIStore((s) => s.setTagsOpen);
  const t = useTranslation();
  const keyboardOpen = useKeyboardStore((s) => s.onScreen || s.expected);
  const cloud = getCloud();
  useGlobalHotkeys();
  useKeepFocusedFormAboveKeyboard();
  const previousScreen = useRef(screen);
  const direction = SCREEN_ORDER.indexOf(screen) >= SCREEN_ORDER.indexOf(previousScreen.current) ? 1 : -1;

  useEffect(() => {
    previousScreen.current = screen;
  }, [screen]);

  useEffect(() => preloadDialogs(), []);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useLayoutEffect(() => {
    applyAccentColor(accentColor, theme);
  }, [accentColor, theme]);

  useLayoutEffect(() => {
    applyThemeColorMeta();
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.appTitle;
  }, [language, t.appTitle]);

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex min-h-screen flex-col overflow-x-clip pb-[calc(6rem+var(--safe-bottom)+var(--keyboard-inset))] text-foreground md:pb-0 md:pl-64">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background px-5 pt-[max(0.75rem,var(--safe-top))] pb-3 md:fixed md:top-0 md:left-0 md:z-40 md:w-64 md:border-b-0 md:bg-transparent md:pt-5 md:pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="font-display text-lg">{t.appTitle}</h1>
          <span
            role="img"
            aria-label={`${t.studyLanguageLabel}: ${STUDY_LANGUAGE_PROFILES[studyLanguage].name}`}
            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary uppercase"
          >
            {studyLanguage}
          </span>
        </div>
        <button
          type="button"
          aria-label={t.settingsButtonLabel}
          onClick={() => setSettingsOpen(true)}
          className="flex h-11 w-11 md:h-9 md:w-9 items-center justify-center rounded-full bg-secondary/70 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
        >
          <SettingsIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-5 pb-24 md:max-w-3xl md:px-8 md:pt-8 xl:max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -28 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            className="flex flex-1 flex-col"
          >
            {screen === 'newWords' && <NewWordsSession key={studyLanguage} />}
            {screen === 'review' && <ReviewSession key={studyLanguage} />}
            {screen === 'words' && <WordList />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {!selectingWords && !keyboardOpen && (
          <motion.button
            key="add-word"
            type="button"
            aria-label={t.addWordButtonLabel}
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.92 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={() => setAddWordOpen(true)}
            className="fixed right-4 bottom-[calc(6.25rem+var(--safe-bottom))] z-20 flex h-16 w-16 items-center justify-center gap-2 rounded-[1.4rem] bg-primary-sheen text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.2),0_10px_24px_-10px_var(--primary)] transition-shadow duration-200 hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.2),0_16px_32px_-12px_var(--primary)] md:right-8 md:bottom-8 md:h-12 md:w-auto md:rounded-xl md:px-5 md:text-sm md:font-medium"
          >
            <Plus className="h-7 w-7 md:h-5 md:w-5" strokeWidth={2.4} aria-hidden="true" />
            <span className="hidden md:inline">{t.addWordCta}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <Dialog open={addWordOpen} onOpenChange={setAddWordOpen}>
        <DialogContent>
          <DialogTitle>{t.addWordButtonLabel}</DialogTitle>
          <Suspense fallback={<DialogBodySkeleton />}>
            <LazyAddWordDialog
              onDone={() => {
                setAddWordOpen(false);
              }}
            />
          </Suspense>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogTitle>{t.settingsButtonLabel}</DialogTitle>
          <Suspense fallback={<DialogBodySkeleton />}>
            <LazySettingsPage />
          </Suspense>
        </DialogContent>
      </Dialog>

      <Suspense fallback={null}>
        <LazyFoldersDialog open={foldersOpen} onOpenChange={setFoldersOpen} />
        <LazyTagsDialog open={tagsOpen} onOpenChange={setTagsOpen} />
        {cloud && <LazyLoginDialog cloud={cloud} />}
        <TelegramLaunchDialogs />
      </Suspense>

      <NavBar />
    </div>
    </MotionConfig>
  );
}

export default App;
