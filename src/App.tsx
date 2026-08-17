import { NavBar } from '@/components/layout/NavBar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
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
        {screen === 'home' && <p>Главная (Task 13)</p>}
        {screen === 'add' && <p>Добавить слово (Task 10)</p>}
        {screen === 'words' && <p>Мои слова (Task 11)</p>}
        {screen === 'study' && <p>Учить (Task 12)</p>}
        {screen === 'stats' && <p>Статистика (Task 14)</p>}
      </main>
      <NavBar />
    </div>
  );
}

export default App;
