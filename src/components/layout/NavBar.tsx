import { useUIStore, type Screen } from '@/store/useUIStore';

const ITEMS: { screen: Screen; label: string }[] = [
  { screen: 'home', label: 'Главная' },
  { screen: 'study', label: 'Учить' },
  { screen: 'add', label: 'Добавить' },
  { screen: 'words', label: 'Слова' },
  { screen: 'stats', label: 'Статистика' },
];

export function NavBar() {
  const screen = useUIStore((s) => s.screen);
  const setScreen = useUIStore((s) => s.setScreen);

  return (
    <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t bg-background p-2 text-sm">
      {ITEMS.map((item) => (
        <button
          key={item.screen}
          type="button"
          onClick={() => setScreen(item.screen)}
          className={
            screen === item.screen
              ? 'font-semibold text-primary'
              : 'text-muted-foreground'
          }
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
