import { NavBar } from '@/components/layout/NavBar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Dashboard } from '@/features/home/Dashboard';
import { StudySession } from '@/features/study/StudySession';
import { WordForm } from '@/features/words/WordForm';
import { WordList } from '@/features/words/WordList';
import { useUIStore } from '@/store/useUIStore';

function App() {
  const screen = useUIStore((s) => s.screen);

  return (
    <div className="min-h-screen bg-background pb-16 text-foreground">
      <header className="flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold">Мой словарь</h1>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-md p-4">
        {screen === 'home' && <Dashboard />}
        {screen === 'add' && (
          <WordForm mode="create" onDone={() => useUIStore.getState().setScreen('words')} />
        )}
        {screen === 'words' && <WordList />}
        {screen === 'study' && <StudySession />}
        {screen === 'stats' && <p>Статистика (Task 14)</p>}
      </main>
      <NavBar />
    </div>
  );
}

export default App;
