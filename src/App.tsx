import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavBar } from '@/components/layout/NavBar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Dashboard } from '@/features/home/Dashboard';
import { StudySession } from '@/features/study/StudySession';
import { StatsPage } from '@/features/stats/StatsPage';
import { WordForm } from '@/features/words/WordForm';
import { WordList } from '@/features/words/WordList';
import { useUIStore } from '@/store/useUIStore';

function App() {
  const screen = useUIStore((s) => s.screen);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

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
            {screen === 'home' && <Dashboard />}
            {screen === 'add' && (
              <WordForm mode="create" onDone={() => useUIStore.getState().setScreen('words')} />
            )}
            {screen === 'words' && <WordList />}
            {screen === 'study' && <StudySession />}
            {screen === 'stats' && <StatsPage />}
          </motion.div>
        </AnimatePresence>
      </main>
      <NavBar />
    </div>
  );
}

export default App;
