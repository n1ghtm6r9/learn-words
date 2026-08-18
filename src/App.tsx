import { useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { NavBar } from '@/components/layout/NavBar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { NewWordsSession } from '@/features/newWords/NewWordsSession';
import { ReviewSession } from '@/features/review/ReviewSession';
import { AddWordDialog } from '@/features/words/AddWordDialog';
import { WordList } from '@/features/words/WordList';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { useUIStore } from '@/store/useUIStore';
import { applyAccentColor } from '@/lib/applyAccentColor';

function App() {
  const screen = useUIStore((s) => s.screen);
  const theme = useUIStore((s) => s.theme);
  const accentColor = useUIStore((s) => s.accentColor);
  const addWordOpen = useUIStore((s) => s.addWordOpen);
  const setAddWordOpen = useUIStore((s) => s.setAddWordOpen);
  const setScreen = useUIStore((s) => s.setScreen);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useLayoutEffect(() => {
    applyAccentColor(accentColor, theme);
  }, [accentColor, theme]);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <h1 className="font-mono text-base font-semibold tracking-tight">Мой словарь</h1>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-md p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {screen === 'newWords' && <NewWordsSession />}
            {screen === 'review' && <ReviewSession />}
            {screen === 'words' && <WordList />}
            {screen === 'settings' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <motion.button
        type="button"
        aria-label="Добавить слово"
        whileTap={{ scale: 0.92 }}
        onClick={() => setAddWordOpen(true)}
        className="fixed right-4 bottom-20 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </motion.button>

      <Dialog open={addWordOpen} onOpenChange={setAddWordOpen}>
        <DialogContent>
          <DialogTitle>Добавить слово</DialogTitle>
          <AddWordDialog
            onDone={() => {
              setAddWordOpen(false);
              setScreen('words');
            }}
          />
        </DialogContent>
      </Dialog>

      <NavBar />
    </div>
  );
}

export default App;
