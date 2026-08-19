import { useEffect, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Settings as SettingsIcon } from 'lucide-react';
import { NavBar } from '@/components/layout/NavBar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { NewWordsSession } from '@/features/newWords/NewWordsSession';
import { ReviewSession } from '@/features/review/ReviewSession';
import { AddWordDialog } from '@/features/words/AddWordDialog';
import { WordList } from '@/features/words/WordList';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { useUIStore } from '@/store/useUIStore';
import { applyAccentColor } from '@/lib/applyAccentColor';
import { useTranslation } from '@/lib/useTranslation';

function App() {
  const screen = useUIStore((s) => s.screen);
  const theme = useUIStore((s) => s.theme);
  const language = useUIStore((s) => s.language);
  const accentColor = useUIStore((s) => s.accentColor);
  const addWordOpen = useUIStore((s) => s.addWordOpen);
  const setAddWordOpen = useUIStore((s) => s.setAddWordOpen);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const t = useTranslation();

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useLayoutEffect(() => {
    applyAccentColor(accentColor, theme);
  }, [accentColor, theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.appTitle;
  }, [language, t.appTitle]);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <h1 className="font-mono text-base font-semibold tracking-tight">{t.appTitle}</h1>
        <button
          type="button"
          aria-label={t.settingsButtonLabel}
          onClick={() => setSettingsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <SettingsIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-1 flex-col"
          >
            {screen === 'newWords' && <NewWordsSession />}
            {screen === 'review' && <ReviewSession />}
            {screen === 'words' && <WordList />}
          </motion.div>
        </AnimatePresence>
      </main>

      <motion.button
        type="button"
        aria-label={t.addWordButtonLabel}
        whileTap={{ scale: 0.92 }}
        onClick={() => setAddWordOpen(true)}
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </motion.button>

      <Dialog open={addWordOpen} onOpenChange={setAddWordOpen}>
        <DialogContent>
          <DialogTitle>{t.addWordButtonLabel}</DialogTitle>
          <AddWordDialog
            onDone={() => {
              setAddWordOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogTitle>{t.settingsButtonLabel}</DialogTitle>
          <SettingsPage />
        </DialogContent>
      </Dialog>

      <NavBar />
    </div>
  );
}

export default App;
