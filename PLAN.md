# Приложение для изучения слов — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SPA на React для добавления слов с переводом и их заучивания через интервальные повторения (SM-2), полностью офлайн, данные — в IndexedDB браузера.

**Architecture:** Vite + React 19 + TypeScript, без роутера — 5 экранов переключаются через Zustand-стор (`useUIStore`). Данные словаря живут в Dexie (IndexedDB) и читаются в компоненты через `dexie-react-hooks` (`useLiveQuery`), поэтому UI сам обновляется при любых изменениях в БД. Zustand хранит только эфемерное UI-состояние: текущий экран, активную сессию обучения, тему.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, Dexie.js + dexie-react-hooks, Motion, canvas-confetti, Web Speech API, Vitest + React Testing Library + fake-indexeddb.

**Spec:** `docs/superpowers/specs/2026-08-17-vocab-app-design.md`

## Global Constraints

- Никакого бэкенда и сети — всё хранится локально в IndexedDB через Dexie.
- Никакого роутера — переключение экранов только через `useUIStore.screen`.
- Перевод пользователь вводит вручную — никакого автоперевода через внешний API.
- Путь до алиаса `@` всегда указывает на `src/`.
- Все тексты интерфейса — на русском.
- Каждая единица SRS-логики (`lib/srs.ts`, `lib/fuzzyMatch.ts`, `lib/stats.ts`) — чистые функции без побочных эффектов, обязательно покрыты юнит-тестами по TDD.

---

### Task 1: Scaffold проекта (Vite + React 19 + TS + Tailwind v4 + shadcn/ui)

**Files:**
- Create: весь стандартный Vite React-TS boilerplate (`package.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `.gitignore`)
- Create: `components.json` (генерируется shadcn init)

**Interfaces:**
- Produces: алиас `@/*` → `src/*` (используется во всех последующих импортах), Tailwind-классы доступны везде через `src/index.css`, shadcn-компоненты доступны через `@/components/ui/*`.

- [ ] **Step 1: Скаффолдинг Vite во временную папку и перенос в корень**

```bash
npm create vite@latest tmp-vite -- --template react-ts
cp -R tmp-vite/. .
rm -rf tmp-vite
```

Не используй `shopt`/`mv tmp-vite/*` — это bash-специфичный способ захватить скрытые файлы (`.gitignore` и т.п.), а окружение выполняет команды через zsh, где `shopt` не существует. `cp -R tmp-vite/. .` переносит содержимое, включая скрытые файлы, независимо от шелла.

- [ ] **Step 2: Установить зависимости и убедиться, что базовый проект собирается**

```bash
npm install
npm run build
```

Expected: сборка проходит без ошибок, появляется `dist/`.

- [ ] **Step 3: Установить Tailwind v4 и настроить Vite-плагин**

```bash
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
```

Замени содержимое `src/index.css` на:

```css
@import "tailwindcss";
```

Замени `vite.config.ts` на:

```typescript
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 4: Настроить path alias в tsconfig**

Замени `tsconfig.json` на:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

В `tsconfig.app.json` внутри `compilerOptions` добавь:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

- [ ] **Step 5: Инициализировать shadcn/ui**

```bash
npx shadcn@latest init -d
```

Expected: команда создаёт `components.json` и `src/lib/utils.ts` без интерактивных вопросов (флаг `-d` — defaults).

- [ ] **Step 6: Добавить нужные shadcn-компоненты**

```bash
npx shadcn@latest add button input card dialog progress
```

Expected: в `src/components/ui/` появляются `button.tsx`, `input.tsx`, `card.tsx`, `dialog.tsx`, `progress.tsx`.

- [ ] **Step 7: Проверить, что dev-сервер и сборка работают**

```bash
npm run build
```

Expected: сборка проходит без ошибок TypeScript.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React 19 + TS + Tailwind v4 + shadcn/ui"
```

---

### Task 2: Настройка Vitest + Testing Library + fake-indexeddb

**Files:**
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json` (добавить скрипты `test`, `test:watch`)

**Interfaces:**
- Produces: `src/test/setup.ts` — глобальный setup для всех тестов (jest-dom матчеры, fake-indexeddb, `ResizeObserver`-стаб). Все последующие тестовые задачи полагаются на то, что этот файл подключён через `vitest.config` → `test.setupFiles`.

- [ ] **Step 1: Установить тестовые зависимости**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom fake-indexeddb
```

- [ ] **Step 2: Переключить `vite.config.ts` на `vitest/config` и добавить секцию `test`**

Замени импорт `defineConfig` с `"vite"` на `"vitest/config"` и добавь блок `test`:

```typescript
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
})
```

- [ ] **Step 3: Создать `src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
```

- [ ] **Step 4: Добавить тестовые скрипты в `package.json`**

В секцию `"scripts"` добавь:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Написать тривиальный тест, чтобы проверить, что раннер работает**

Создай `src/sanity.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Запустить тесты**

```bash
npm run test
```

Expected: PASS, 1 тест пройден.

- [ ] **Step 7: Удалить sanity-тест и закоммитить**

```bash
rm src/sanity.test.ts
git add -A
git commit -m "chore: set up Vitest + Testing Library + fake-indexeddb"
```

---

### Task 3: Dexie-схема и типы

**Files:**
- Create: `src/db/db.ts`
- Test: `src/db/db.test.ts`

**Interfaces:**
- Produces:
  - `interface Word { id?: number; term: string; translation: string; category?: string; createdAt: number; easinessFactor: number; interval: number; repetitions: number; dueDate: number; lastReviewedAt?: number; }`
  - `interface ReviewLog { id?: number; wordId: number; reviewedAt: number; correct: boolean; }`
  - `export const db: VocabDB` с таблицами `db.words: Table<Word, number>`, `db.reviews: Table<ReviewLog, number>`
  - `function createWord(term: string, translation: string, category?: string): Word`

- [ ] **Step 1: Установить Dexie**

```bash
npm install dexie dexie-react-hooks
```

- [ ] **Step 2: Написать падающий тест на схему и `createWord`**

Создай `src/db/db.test.ts`:

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { createWord, db } from './db';

describe('VocabDB', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.reviews.clear();
  });

  it('creates a word with default SRS state due immediately', () => {
    const before = Date.now();
    const word = createWord('hello', 'привет', 'english');
    const after = Date.now();

    expect(word.term).toBe('hello');
    expect(word.translation).toBe('привет');
    expect(word.category).toBe('english');
    expect(word.easinessFactor).toBe(2.5);
    expect(word.interval).toBe(0);
    expect(word.repetitions).toBe(0);
    expect(word.dueDate).toBeGreaterThanOrEqual(before);
    expect(word.dueDate).toBeLessThanOrEqual(after);
  });

  it('persists and retrieves a word via Dexie', async () => {
    const word = createWord('cat', 'кот');
    const id = await db.words.add(word);

    const stored = await db.words.get(id);
    expect(stored?.term).toBe('cat');
    expect(stored?.translation).toBe('кот');
  });

  it('persists a review log linked to a word', async () => {
    const wordId = await db.words.add(createWord('dog', 'собака'));
    await db.reviews.add({ wordId, reviewedAt: Date.now(), correct: true });

    const reviews = await db.reviews.where('wordId').equals(wordId).toArray();
    expect(reviews).toHaveLength(1);
    expect(reviews[0].correct).toBe(true);
  });
});
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
npm run test -- src/db/db.test.ts
```

Expected: FAIL — `src/db/db.ts` ещё не существует.

- [ ] **Step 3: Реализовать `src/db/db.ts`**

```typescript
import Dexie, { type Table } from 'dexie';

export interface Word {
  id?: number;
  term: string;
  translation: string;
  category?: string;
  createdAt: number;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  dueDate: number;
  lastReviewedAt?: number;
}

export interface ReviewLog {
  id?: number;
  wordId: number;
  reviewedAt: number;
  correct: boolean;
}

export class VocabDB extends Dexie {
  words!: Table<Word, number>;
  reviews!: Table<ReviewLog, number>;

  constructor() {
    super('vocab-db');
    this.version(1).stores({
      words: '++id, term, category, dueDate',
      reviews: '++id, wordId, reviewedAt',
    });
  }
}

export const db = new VocabDB();

export function createWord(term: string, translation: string, category?: string): Word {
  const now = Date.now();
  return {
    term,
    translation,
    category,
    createdAt: now,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: now,
  };
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
npm run test -- src/db/db.test.ts
```

Expected: PASS, 3 теста пройдены.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Dexie schema for words and review logs"
```

---

### Task 4: SM-2 алгоритм и выбор слов на сегодня (`lib/srs.ts`)

**Files:**
- Create: `src/lib/srs.ts`
- Test: `src/lib/srs.test.ts`

**Interfaces:**
- Consumes: `Word` из `src/db/db.ts`
- Produces:
  - `export const DAY_MS: number`
  - `export interface SrsState { easinessFactor: number; interval: number; repetitions: number; }`
  - `export function nextSrsState(state: SrsState, quality: number): SrsState`
  - `export function selectDueWords(words: Word[], now: number, limit?: number): Word[]`

- [ ] **Step 1: Написать падающие тесты**

Создай `src/lib/srs.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { nextSrsState, selectDueWords, type SrsState } from './srs';
import type { Word } from '../db/db';

describe('nextSrsState', () => {
  const initial: SrsState = { easinessFactor: 2.5, interval: 0, repetitions: 0 };

  it('первый верный ответ (quality=5) даёт интервал 1 день', () => {
    const next = nextSrsState(initial, 5);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(1);
    expect(next.easinessFactor).toBeCloseTo(2.6, 5);
  });

  it('второй подряд верный ответ даёт интервал 6 дней', () => {
    const afterFirst = nextSrsState(initial, 5);
    const afterSecond = nextSrsState(afterFirst, 5);
    expect(afterSecond.interval).toBe(6);
    expect(afterSecond.repetitions).toBe(2);
  });

  it('третий подряд верный ответ умножает интервал на easinessFactor', () => {
    const s1 = nextSrsState(initial, 5);
    const s2 = nextSrsState(s1, 5);
    const s3 = nextSrsState(s2, 5);
    expect(s3.interval).toBe(Math.round(6 * s2.easinessFactor));
    expect(s3.repetitions).toBe(3);
  });

  it('quality=4 ("почти") не меняет easinessFactor', () => {
    const next = nextSrsState(initial, 4);
    expect(next.easinessFactor).toBeCloseTo(2.5, 5);
  });

  it('неверный ответ (quality<3) сбрасывает repetitions и interval, снижает EF', () => {
    const learned = nextSrsState(nextSrsState(initial, 5), 5);
    const afterWrong = nextSrsState(learned, 2);

    expect(afterWrong.repetitions).toBe(0);
    expect(afterWrong.interval).toBe(1);
    expect(afterWrong.easinessFactor).toBeLessThan(learned.easinessFactor);
  });

  it('easinessFactor никогда не опускается ниже 1.3', () => {
    let state = initial;
    for (let i = 0; i < 20; i++) {
      state = nextSrsState(state, 0);
    }
    expect(state.easinessFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('selectDueWords', () => {
  function makeWord(id: number, dueDate: number): Word {
    return {
      id,
      term: `word-${id}`,
      translation: `перевод-${id}`,
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate,
    };
  }

  it('выбирает только слова с dueDate <= now', () => {
    const now = 1000;
    const words = [makeWord(1, 500), makeWord(2, 1500), makeWord(3, 1000)];
    const due = selectDueWords(words, now);
    expect(due.map((w) => w.id)).toEqual([1, 3]);
  });

  it('сортирует просроченные слова по dueDate по возрастанию', () => {
    const now = 1000;
    const words = [makeWord(1, 900), makeWord(2, 100), makeWord(3, 500)];
    const due = selectDueWords(words, now);
    expect(due.map((w) => w.id)).toEqual([2, 3, 1]);
  });

  it('ограничивает количество слов параметром limit', () => {
    const now = 1000;
    const words = [makeWord(1, 100), makeWord(2, 200), makeWord(3, 300)];
    const due = selectDueWords(words, now, 2);
    expect(due).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что тесты падают**

```bash
npm run test -- src/lib/srs.test.ts
```

Expected: FAIL — `src/lib/srs.ts` не существует.

- [ ] **Step 3: Реализовать `src/lib/srs.ts`**

```typescript
import type { Word } from '../db/db';

export const DAY_MS = 24 * 60 * 60 * 1000;

export interface SrsState {
  easinessFactor: number;
  interval: number;
  repetitions: number;
}

export function nextSrsState(state: SrsState, quality: number): SrsState {
  let { easinessFactor, interval, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
  }

  easinessFactor =
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  return { easinessFactor, interval, repetitions };
}

export function selectDueWords(words: Word[], now: number, limit = 20): Word[] {
  return words
    .filter((word) => word.dueDate <= now)
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, limit);
}
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

```bash
npm run test -- src/lib/srs.test.ts
```

Expected: PASS, все тесты зелёные.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement SM-2 scheduling and due-word selection"
```

---

### Task 5: Нечёткое сравнение ответа (`lib/fuzzyMatch.ts`)

**Files:**
- Create: `src/lib/fuzzyMatch.ts`
- Test: `src/lib/fuzzyMatch.test.ts`

**Interfaces:**
- Produces:
  - `export type MatchVerdict = 'correct' | 'almost' | 'wrong'`
  - `export function matchAnswer(input: string, expected: string): MatchVerdict`

- [ ] **Step 1: Написать падающие тесты**

Создай `src/lib/fuzzyMatch.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { matchAnswer } from './fuzzyMatch';

describe('matchAnswer', () => {
  it('точное совпадение — correct', () => {
    expect(matchAnswer('привет', 'привет')).toBe('correct');
  });

  it('регистр и пробелы по краям не влияют на результат', () => {
    expect(matchAnswer('  Привет  ', 'привет')).toBe('correct');
  });

  it('одна опечатка в коротком слове — almost', () => {
    expect(matchAnswer('кот', 'код')).toBe('almost');
  });

  it('одна опечатка в длинном слове — almost', () => {
    expect(matchAnswer('путешествие', 'путешествия')).toBe('almost');
  });

  it('совсем другое слово — wrong', () => {
    expect(matchAnswer('собака', 'кот')).toBe('wrong');
  });

  it('пустой ввод — wrong', () => {
    expect(matchAnswer('', 'привет')).toBe('wrong');
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что тесты падают**

```bash
npm run test -- src/lib/fuzzyMatch.test.ts
```

Expected: FAIL — файла ещё нет.

- [ ] **Step 3: Реализовать `src/lib/fuzzyMatch.ts`**

```typescript
export type MatchVerdict = 'correct' | 'almost' | 'wrong';

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function matchAnswer(input: string, expected: string): MatchVerdict {
  const a = normalize(input);
  const b = normalize(expected);

  if (a === b) return 'correct';
  if (a.length === 0) return 'wrong';

  const distance = levenshtein(a, b);
  const allowedDistance = b.length <= 4 ? 1 : b.length <= 8 ? 2 : 3;

  return distance <= allowedDistance ? 'almost' : 'wrong';
}
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

```bash
npm run test -- src/lib/fuzzyMatch.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement fuzzy answer matching"
```

---

### Task 6: Обёртка над Web Speech API (`lib/tts.ts`)

**Files:**
- Create: `src/lib/tts.ts`
- Test: `src/lib/tts.test.ts`

**Interfaces:**
- Produces:
  - `export function isSpeechSupported(): boolean`
  - `export function speak(text: string, lang?: string): void`

- [ ] **Step 1: Написать падающий тест**

Создай `src/lib/tts.test.ts`:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isSpeechSupported, speak } from './tts';

describe('tts', () => {
  afterEach(() => {
    // @ts-expect-error — убираем тестовый мок между тестами
    delete window.speechSynthesis;
    vi.restoreAllMocks();
  });

  it('isSpeechSupported возвращает false, если API недоступен', () => {
    expect(isSpeechSupported()).toBe(false);
  });

  it('speak вызывает cancel и speak с текстом', () => {
    const cancel = vi.fn();
    const speakFn = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel, speak: speakFn },
    });

    speak('hello', 'en-US');

    expect(cancel).toHaveBeenCalledOnce();
    expect(speakFn).toHaveBeenCalledOnce();
    const utterance = speakFn.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe('hello');
    expect(utterance.lang).toBe('en-US');
  });

  it('speak ничего не делает, если API недоступен', () => {
    expect(() => speak('hello')).not.toThrow();
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что тест падает**

```bash
npm run test -- src/lib/tts.test.ts
```

Expected: FAIL — файла ещё нет.

- [ ] **Step 3: Реализовать `src/lib/tts.ts`**

```typescript
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, lang = 'en-US'): void {
  if (!isSpeechSupported()) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

```bash
npm run test -- src/lib/tts.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Web Speech API wrapper for pronunciation"
```

---

### Task 7: Статистика — точность, streak, mastered (`lib/stats.ts`)

**Files:**
- Create: `src/lib/stats.ts`
- Test: `src/lib/stats.test.ts`

**Interfaces:**
- Consumes: `ReviewLog`, `Word` из `src/db/db.ts`; `DAY_MS` из `src/lib/srs.ts`
- Produces:
  - `export function computeAccuracy(reviews: ReviewLog[], sinceDays: number, now: number): number` (0–100)
  - `export function computeStreak(reviews: ReviewLog[], now: number): number` (дней подряд)
  - `export function countMastered(words: Word[], thresholdDays?: number): number`
  - `export function last30DaysActivity(reviews: ReviewLog[], now: number): boolean[]` (30 элементов, от старого дня к сегодняшнему)

- [ ] **Step 1: Написать падающие тесты**

Создай `src/lib/stats.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { computeAccuracy, computeStreak, countMastered, last30DaysActivity } from './stats';
import { DAY_MS } from './srs';
import type { ReviewLog, Word } from '../db/db';

const NOW = Date.parse('2026-08-17T12:00:00.000Z');

function review(reviewedAt: number, correct: boolean): ReviewLog {
  return { wordId: 1, reviewedAt, correct };
}

describe('computeAccuracy', () => {
  it('считает процент верных ответов за последние N дней', () => {
    const reviews = [
      review(NOW, true),
      review(NOW, true),
      review(NOW, false),
      review(NOW, true),
    ];
    expect(computeAccuracy(reviews, 7, NOW)).toBe(75);
  });

  it('игнорирует ответы за пределами окна', () => {
    const reviews = [
      review(NOW, false),
      review(NOW - 10 * DAY_MS, true),
    ];
    expect(computeAccuracy(reviews, 7, NOW)).toBe(0);
  });

  it('возвращает 0, если ответов не было', () => {
    expect(computeAccuracy([], 7, NOW)).toBe(0);
  });
});

describe('computeStreak', () => {
  it('считает подряд идущие дни с ответами, включая сегодня', () => {
    const reviews = [
      review(NOW, true),
      review(NOW - 1 * DAY_MS, true),
      review(NOW - 2 * DAY_MS, false),
    ];
    expect(computeStreak(reviews, NOW)).toBe(3);
  });

  it('обрывает streak на пропущенном дне', () => {
    const reviews = [
      review(NOW, true),
      review(NOW - 2 * DAY_MS, true),
    ];
    expect(computeStreak(reviews, NOW)).toBe(1);
  });

  it('возвращает 0, если сегодня ответов не было', () => {
    const reviews = [review(NOW - 1 * DAY_MS, true)];
    expect(computeStreak(reviews, NOW)).toBe(0);
  });
});

describe('countMastered', () => {
  function word(interval: number): Word {
    return {
      term: 'x',
      translation: 'y',
      createdAt: 0,
      easinessFactor: 2.5,
      interval,
      repetitions: 0,
      dueDate: 0,
    };
  }

  it('считает слова с interval >= порога (по умолчанию 21 день)', () => {
    const words = [word(1), word(21), word(30)];
    expect(countMastered(words)).toBe(2);
  });
});

describe('last30DaysActivity', () => {
  it('возвращает массив из 30 булевых значений, последний элемент — сегодня', () => {
    const reviews = [review(NOW, true)];
    const activity = last30DaysActivity(reviews, NOW);
    expect(activity).toHaveLength(30);
    expect(activity[29]).toBe(true);
    expect(activity[0]).toBe(false);
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что тесты падают**

```bash
npm run test -- src/lib/stats.test.ts
```

Expected: FAIL — файла ещё нет.

- [ ] **Step 3: Реализовать `src/lib/stats.ts`**

```typescript
import type { ReviewLog, Word } from '../db/db';
import { DAY_MS } from './srs';

export function computeAccuracy(reviews: ReviewLog[], sinceDays: number, now: number): number {
  const since = now - sinceDays * DAY_MS;
  const recent = reviews.filter((r) => r.reviewedAt >= since && r.reviewedAt <= now);
  if (recent.length === 0) return 0;

  const correctCount = recent.filter((r) => r.correct).length;
  return Math.round((correctCount / recent.length) * 100);
}

function dayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function computeStreak(reviews: ReviewLog[], now: number): number {
  const daysWithReview = new Set(reviews.map((r) => dayKey(r.reviewedAt)));
  let streak = 0;
  let cursor = now;

  while (daysWithReview.has(dayKey(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }

  return streak;
}

export function countMastered(words: Word[], thresholdDays = 21): number {
  return words.filter((w) => w.interval >= thresholdDays).length;
}

export function last30DaysActivity(reviews: ReviewLog[], now: number): boolean[] {
  const daysWithReview = new Set(reviews.map((r) => dayKey(r.reviewedAt)));
  const days: boolean[] = [];

  for (let i = 29; i >= 0; i--) {
    days.push(daysWithReview.has(dayKey(now - i * DAY_MS)));
  }

  return days;
}
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

```bash
npm run test -- src/lib/stats.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement accuracy, streak and mastered-word stats"
```

---

### Task 8: Zustand UI-стор (`store/useUIStore.ts`)

**Files:**
- Create: `src/store/useUIStore.ts`
- Test: `src/store/useUIStore.test.ts`

**Interfaces:**
- Consumes: `Word` из `src/db/db.ts`; `MatchVerdict` из `src/lib/fuzzyMatch.ts`
- Produces:
  - `export type Screen = 'home' | 'add' | 'study' | 'words' | 'stats'`
  - `export interface StudySessionState { queue: Word[]; index: number; correct: number; almost: number; wrong: number; }`
  - `export const useUIStore: UseBoundStore<...>` с полями/методами: `screen`, `setScreen(screen)`, `theme`, `toggleTheme()`, `session: StudySessionState | null`, `startSession(queue: Word[])`, `recordAnswer(verdict: MatchVerdict)`, `endSession()`

- [ ] **Step 1: Установить Zustand**

```bash
npm install zustand
```

- [ ] **Step 2: Написать падающие тесты**

Создай `src/store/useUIStore.test.ts`:

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './useUIStore';
import type { Word } from '../db/db';

function word(id: number): Word {
  return {
    id,
    term: `t${id}`,
    translation: `p${id}`,
    createdAt: 0,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: 0,
  };
}

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ screen: 'home', session: null });
    window.localStorage.clear();
  });

  it('setScreen меняет текущий экран', () => {
    useUIStore.getState().setScreen('study');
    expect(useUIStore.getState().screen).toBe('study');
  });

  it('toggleTheme переключает тему и сохраняет в localStorage', () => {
    const before = useUIStore.getState().theme;
    useUIStore.getState().toggleTheme();
    const after = useUIStore.getState().theme;

    expect(after).not.toBe(before);
    expect(window.localStorage.getItem('theme')).toBe(after);
  });

  it('startSession инициализирует сессию с нулевыми счётчиками', () => {
    useUIStore.getState().startSession([word(1), word(2)]);
    const session = useUIStore.getState().session;

    expect(session?.queue).toHaveLength(2);
    expect(session?.index).toBe(0);
    expect(session?.correct).toBe(0);
  });

  it('recordAnswer увеличивает счётчик и индекс', () => {
    useUIStore.getState().startSession([word(1), word(2)]);
    useUIStore.getState().recordAnswer('correct');

    const session = useUIStore.getState().session;
    expect(session?.correct).toBe(1);
    expect(session?.index).toBe(1);
  });

  it('endSession очищает сессию', () => {
    useUIStore.getState().startSession([word(1)]);
    useUIStore.getState().endSession();
    expect(useUIStore.getState().session).toBeNull();
  });
});
```

- [ ] **Step 3: Запустить и убедиться, что тесты падают**

```bash
npm run test -- src/store/useUIStore.test.ts
```

Expected: FAIL — файла ещё нет.

- [ ] **Step 4: Реализовать `src/store/useUIStore.ts`**

```typescript
import { create } from 'zustand';
import type { Word } from '../db/db';
import type { MatchVerdict } from '../lib/fuzzyMatch';

export type Screen = 'home' | 'add' | 'study' | 'words' | 'stats';
export type Theme = 'light' | 'dark';

export interface StudySessionState {
  queue: Word[];
  index: number;
  correct: number;
  almost: number;
  wrong: number;
}

interface UIStore {
  screen: Screen;
  setScreen: (screen: Screen) => void;

  theme: Theme;
  toggleTheme: () => void;

  session: StudySessionState | null;
  startSession: (queue: Word[]) => void;
  recordAnswer: (verdict: MatchVerdict) => void;
  endSession: () => void;
}

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
}

export const useUIStore = create<UIStore>((set) => ({
  screen: 'home',
  setScreen: (screen) => set({ screen }),

  theme: readInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', next);
      }
      return { theme: next };
    }),

  session: null,
  startSession: (queue) =>
    set({ session: { queue, index: 0, correct: 0, almost: 0, wrong: 0 } }),
  recordAnswer: (verdict) =>
    set((state) => {
      if (!state.session) return state;
      const session = { ...state.session, [verdict]: state.session[verdict] + 1, index: state.session.index + 1 };
      return { session };
    }),
  endSession: () => set({ session: null }),
}));
```

- [ ] **Step 5: Запустить тесты и убедиться, что проходят**

```bash
npm run test -- src/store/useUIStore.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Zustand UI store for screens, theme and study session"
```

---

### Task 9: Каркас приложения — навигация, тема, `App.tsx`

**Files:**
- Create: `src/components/layout/NavBar.tsx`
- Create: `src/components/layout/ThemeToggle.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css` (тёмная тема через класс `.dark`)

**Interfaces:**
- Consumes: `useUIStore` из `src/store/useUIStore.ts`
- Produces: `<NavBar />`, `<ThemeToggle />` — переиспользуются как есть, без пропсов (читают всё из стора).

Экраны `Dashboard`, `WordForm`, `WordList`, `StudySession`, `StatsPage` из следующих задач ещё не существуют — на этом шаге в `App.tsx` подключаем только заглушки, а реальные импорты добавляются по мере готовности задач 10–14 (просто раскомментировать/добавить импорт).

- [ ] **Step 1: Установить Motion и canvas-confetti (нужны следующим задачам, ставим сейчас пакетом)**

```bash
npm install motion canvas-confetti
npm install -D @types/canvas-confetti
```

- [ ] **Step 2: Создать `src/components/layout/NavBar.tsx`**

```tsx
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
```

- [ ] **Step 3: Создать `src/components/layout/ThemeToggle.tsx`**

```tsx
import { useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';

export function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <button type="button" onClick={toggleTheme} aria-label="Переключить тему">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

- [ ] **Step 4: Убедиться, что в `src/index.css` есть вариант тёмной темы**

Открой `src/index.css`. Команда `shadcn init` из Task 1 обычно уже добавляет строку `@custom-variant dark (&:where(.dark, .dark *));` вместе с CSS-переменными темы. Если она уже есть — ничего не делай. Если её нет — добавь в конец файла:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Не добавляй эту строку второй раз, если она уже присутствует — Tailwind не должен получить два конфликтующих объявления `@custom-variant dark`.

- [ ] **Step 5: Переписать `src/App.tsx`**

```tsx
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
```

- [ ] **Step 6: Проверить сборку**

```bash
npm run build
```

Expected: сборка проходит без ошибок.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add app shell with navigation and theme toggle"
```

---

### Task 10: Экран «Добавить слово» (`features/words/WordForm.tsx`)

**Files:**
- Create: `src/features/words/WordForm.tsx`
- Test: `src/features/words/WordForm.test.tsx`
- Modify: `src/App.tsx` (подключить `WordForm` на экране `add`)

**Interfaces:**
- Consumes: `db`, `createWord` из `src/db/db.ts`; `Word` из `src/db/db.ts`
- Produces: `interface WordFormProps { mode: 'create' | 'edit'; word?: Word; onDone: () => void; }`, `export function WordForm(props: WordFormProps)` — используется в Task 11 (диалог редактирования) и в `App.tsx`.

- [ ] **Step 1: Написать падающий тест**

Создай `src/features/words/WordForm.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordForm } from './WordForm';
import { db } from '@/db/db';

describe('WordForm', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('создаёт слово и вызывает onDone', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={onDone} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.type(screen.getByLabelText('Перевод'), 'привет');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const words = await db.words.toArray();
      expect(words).toHaveLength(1);
      expect(words[0].term).toBe('hello');
    });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('показывает предупреждение о дубликате, но не блокирует сохранение', async () => {
    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: 0,
    });

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={onDone} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.type(screen.getByLabelText('Перевод'), 'приветствие');

    expect(await screen.findByText(/уже есть в словаре/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    await waitFor(async () => {
      expect(await db.words.count()).toBe(2);
    });
  });

  it('в режиме edit обновляет существующее слово', async () => {
    const id = await db.words.add({
      term: 'cat',
      translation: 'кот',
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: 0,
    });
    const existing = (await db.words.get(id))!;

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="edit" word={existing} onDone={onDone} />);

    const translationInput = screen.getByLabelText('Перевод');
    await user.clear(translationInput);
    await user.type(translationInput, 'котик');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const updated = await db.words.get(id);
      expect(updated?.translation).toBe('котик');
    });
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что тест падает**

```bash
npm run test -- src/features/words/WordForm.test.tsx
```

Expected: FAIL — файла ещё нет.

- [ ] **Step 3: Реализовать `src/features/words/WordForm.tsx`**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createWord, db, type Word } from '@/db/db';

export interface WordFormProps {
  mode: 'create' | 'edit';
  word?: Word;
  onDone: () => void;
}

export function WordForm({ mode, word, onDone }: WordFormProps) {
  const [term, setTerm] = useState(word?.term ?? '');
  const [translation, setTranslation] = useState(word?.translation ?? '');
  const [category, setCategory] = useState(word?.category ?? '');
  const [duplicate, setDuplicate] = useState(false);

  async function checkDuplicate(value: string) {
    if (mode === 'edit' || value.trim() === '') {
      setDuplicate(false);
      return;
    }
    const count = await db.words.where('term').equalsIgnoreCase(value.trim()).count();
    setDuplicate(count > 0);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (mode === 'edit' && word?.id != null) {
      await db.words.update(word.id, {
        term: term.trim(),
        translation: translation.trim(),
        category: category.trim() || undefined,
      });
    } else {
      await db.words.add(createWord(term.trim(), translation.trim(), category.trim() || undefined));
    }

    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Слово
        <Input
          aria-label="Слово"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            void checkDuplicate(e.target.value);
          }}
          required
        />
      </label>

      {duplicate && (
        <p className="text-sm text-amber-600">Такое слово уже есть в словаре — сохранить второй раз?</p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Перевод
        <Input
          aria-label="Перевод"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Категория (необязательно)
        <Input
          aria-label="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </label>

      <Button type="submit">Сохранить</Button>
    </form>
  );
}
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

```bash
npm run test -- src/features/words/WordForm.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Подключить `WordForm` в `App.tsx`**

В `src/App.tsx` добавь импорт `import { WordForm } from '@/features/words/WordForm';` и `import { useUIStore } from '@/store/useUIStore';` (если ещё не импортирован), замени строку экрана `add`:

```tsx
{screen === 'add' && (
  <WordForm mode="create" onDone={() => useUIStore.getState().setScreen('words')} />
)}
```

- [ ] **Step 6: Проверить сборку**

```bash
npm run build
```

Expected: без ошибок.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add word creation/edit form"
```

---

### Task 11: Экран «Мои слова» (`features/words/WordList.tsx`, `WordItem.tsx`)

**Files:**
- Create: `src/features/words/WordItem.tsx`
- Create: `src/features/words/WordList.tsx`
- Test: `src/features/words/WordList.test.tsx`
- Modify: `src/App.tsx` (подключить `WordList` на экране `words`)

**Interfaces:**
- Consumes: `db`, `Word` из `src/db/db.ts`; `WordForm` из `src/features/words/WordForm.tsx`; `Dialog*` из `@/components/ui/dialog`
- Produces: `export function WordList()`, `export function WordItem({ word, onEdit, onDelete }: { word: Word; onEdit: () => void; onDelete: () => void })`

- [ ] **Step 1: Написать падающий тест**

Создай `src/features/words/WordList.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordList } from './WordList';
import { db } from '@/db/db';

function baseWord(overrides: Partial<Parameters<typeof db.words.add>[0]>) {
  return {
    term: 'hello',
    translation: 'привет',
    createdAt: 0,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: 0,
    ...overrides,
  };
}

describe('WordList', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('показывает список сохранённых слов', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));
    await db.words.add(baseWord({ term: 'cat', translation: 'кот' }));

    render(<WordList />);

    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(await screen.findByText('cat')).toBeInTheDocument();
  });

  it('фильтрует по тексту поиска', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));
    await db.words.add(baseWord({ term: 'cat', translation: 'кот' }));

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText('hello');

    await user.type(screen.getByPlaceholderText('Поиск...'), 'cat');

    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
  });

  it('удаляет слово по кнопке', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText('hello');

    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(async () => {
      expect(await db.words.count()).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что тест падает**

```bash
npm run test -- src/features/words/WordList.test.tsx
```

Expected: FAIL — файлов ещё нет.

- [ ] **Step 3: Реализовать `src/features/words/WordItem.tsx`**

```tsx
import { Button } from '@/components/ui/button';
import type { Word } from '@/db/db';

interface WordItemProps {
  word: Word;
  onEdit: () => void;
  onDelete: () => void;
}

export function WordItem({ word, onEdit, onDelete }: WordItemProps) {
  return (
    <li className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="font-medium">{word.term}</p>
        <p className="text-sm text-muted-foreground">{word.translation}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          Изменить
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
          Удалить
        </Button>
      </div>
    </li>
  );
}
```

- [ ] **Step 4: Реализовать `src/features/words/WordList.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { db, type Word } from '@/db/db';
import { WordForm } from './WordForm';
import { WordItem } from './WordItem';

export function WordList() {
  const words = useLiveQuery(() => db.words.orderBy('term').toArray(), []) ?? [];
  const [search, setSearch] = useState('');
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return words;
    return words.filter(
      (w) => w.term.toLowerCase().includes(query) || w.translation.toLowerCase().includes(query),
    );
  }, [words, search]);

  async function handleDelete(id?: number) {
    if (id == null) return;
    await db.words.delete(id);
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Поиск..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Слов пока нет.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((word) => (
            <WordItem
              key={word.id}
              word={word}
              onEdit={() => setEditingWord(word)}
              onDelete={() => void handleDelete(word.id)}
            />
          ))}
        </ul>
      )}

      <Dialog open={editingWord != null} onOpenChange={(open) => !open && setEditingWord(null)}>
        <DialogContent>
          <DialogTitle>Изменить слово</DialogTitle>
          {editingWord && (
            <WordForm mode="edit" word={editingWord} onDone={() => setEditingWord(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 5: Запустить тесты и убедиться, что проходят**

```bash
npm run test -- src/features/words/WordList.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Подключить `WordList` в `App.tsx`**

Добавь `import { WordList } from '@/features/words/WordList';`, замени строку экрана `words`:

```tsx
{screen === 'words' && <WordList />}
```

- [ ] **Step 7: Проверить сборку и полный прогон тестов**

```bash
npm run build
npm run test
```

Expected: сборка и все тесты проходят.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add word list screen with search, edit and delete"
```

---

### Task 12: Экран «Учить» (`features/study/*`)

**Files:**
- Create: `src/features/study/Flashcard.tsx`
- Create: `src/features/study/SessionSummary.tsx`
- Create: `src/features/study/StudySession.tsx`
- Test: `src/features/study/StudySession.test.tsx`
- Modify: `src/App.tsx` (подключить `StudySession` на экране `study`)

**Interfaces:**
- Consumes: `db`, `Word` из `src/db/db.ts`; `nextSrsState`, `selectDueWords`, `DAY_MS` из `src/lib/srs.ts`; `matchAnswer` из `src/lib/fuzzyMatch.ts`; `speak` из `src/lib/tts.ts`; `useUIStore`, `StudySessionState` из `src/store/useUIStore.ts`
- Produces: `export function Flashcard({ word }: { word: Word })`, `export function SessionSummary({ session, onFinish }: { session: StudySessionState; onFinish: () => void })`, `export function StudySession()`

- [ ] **Step 1: Реализовать `src/features/study/Flashcard.tsx`**

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, type Word } from '@/db/db';
import { DAY_MS, nextSrsState } from '@/lib/srs';
import { matchAnswer, type MatchVerdict } from '@/lib/fuzzyMatch';
import { speak, isSpeechSupported } from '@/lib/tts';
import { useUIStore } from '@/store/useUIStore';

interface FlashcardProps {
  word: Word;
}

interface Feedback {
  verdict: MatchVerdict;
  correctAnswer: string;
}

const FEEDBACK_TEXT: Record<MatchVerdict, (correct: string) => string> = {
  correct: () => 'Верно!',
  almost: (correct) => `Почти! Правильный ответ: ${correct}`,
  wrong: (correct) => `Неверно. Правильный ответ: ${correct}`,
};

export function Flashcard({ word }: FlashcardProps) {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const recordAnswer = useUIStore((s) => s.recordAnswer);

  async function handleCheck(event: React.FormEvent) {
    event.preventDefault();

    const verdict = matchAnswer(input, word.translation);
    const quality = verdict === 'correct' ? 5 : verdict === 'almost' ? 4 : 2;
    const next = nextSrsState(word, quality);
    const now = Date.now();

    if (word.id != null) {
      await db.words.update(word.id, {
        ...next,
        dueDate: now + next.interval * DAY_MS,
        lastReviewedAt: now,
      });
      await db.reviews.add({ wordId: word.id, reviewedAt: now, correct: verdict !== 'wrong' });
    }

    setFeedback({ verdict, correctAnswer: word.translation });
  }

  function handleNext() {
    if (!feedback) return;
    recordAnswer(feedback.verdict);
    setInput('');
    setFeedback(null);
  }

  return (
    <motion.div
      key={word.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-lg border p-6"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl font-semibold">{word.term}</span>
        {isSpeechSupported() && (
          <button type="button" aria-label="Озвучить" onClick={() => speak(word.term)}>
            🔊
          </button>
        )}
      </div>

      {!feedback ? (
        <form onSubmit={handleCheck} className="flex flex-col gap-3">
          <Input
            aria-label="Перевод"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <Button type="submit">Проверить</Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p
            data-testid="feedback"
            className={
              feedback.verdict === 'correct'
                ? 'text-green-600'
                : feedback.verdict === 'almost'
                  ? 'text-amber-600'
                  : 'text-red-600'
            }
          >
            {FEEDBACK_TEXT[feedback.verdict](feedback.correctAnswer)}
          </p>
          <Button type="button" onClick={handleNext}>
            Далее
          </Button>
        </div>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Реализовать `src/features/study/SessionSummary.tsx`**

```tsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import type { StudySessionState } from '@/store/useUIStore';

interface SessionSummaryProps {
  session: StudySessionState;
  onFinish: () => void;
}

export function SessionSummary({ session, onFinish }: SessionSummaryProps) {
  useEffect(() => {
    void confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-6 text-center">
      <h2 className="text-xl font-semibold">Сессия завершена</h2>
      <p>Верно: {session.correct}</p>
      <p>Почти: {session.almost}</p>
      <p>Неверно: {session.wrong}</p>
      <Button type="button" onClick={onFinish}>
        На главную
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Реализовать `src/features/study/StudySession.tsx`**

```tsx
import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import { selectDueWords } from '@/lib/srs';
import { useUIStore } from '@/store/useUIStore';
import { Flashcard } from './Flashcard';
import { SessionSummary } from './SessionSummary';

export function StudySession() {
  const words = useLiveQuery(() => db.words.toArray(), []);
  const session = useUIStore((s) => s.session);
  const startSession = useUIStore((s) => s.startSession);
  const endSession = useUIStore((s) => s.endSession);
  const setScreen = useUIStore((s) => s.setScreen);

  useEffect(() => {
    if (!session && words) {
      startSession(selectDueWords(words, Date.now()));
    }
  }, [session, words, startSession]);

  if (!words || !session) {
    return <p>Загрузка...</p>;
  }

  if (session.queue.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p>Сегодня повторять нечего — все слова уже выучены на сегодня.</p>
        <Button type="button" onClick={() => setScreen('home')}>
          На главную
        </Button>
      </div>
    );
  }

  if (session.index >= session.queue.length) {
    return (
      <SessionSummary
        session={session}
        onFinish={() => {
          endSession();
          setScreen('home');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {session.index + 1} из {session.queue.length}
      </p>
      <Flashcard word={session.queue[session.index]} />
    </div>
  );
}
```

- [ ] **Step 4: Написать тест на полный проход одной карточки**

Создай `src/features/study/StudySession.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudySession } from './StudySession';
import { db } from '@/db/db';
import { useUIStore } from '@/store/useUIStore';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('StudySession', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.reviews.clear();
    useUIStore.setState({ session: null });
  });

  it('показывает сообщение, если на сегодня нет слов', async () => {
    render(<StudySession />);
    expect(await screen.findByText(/повторять нечего/i)).toBeInTheDocument();
  });

  it('проходит одну карточку: ответ -> фидбек -> далее -> итог сессии', async () => {
    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: Date.now() - 1000,
    });

    const user = userEvent.setup();
    render(<StudySession />);

    await user.type(await screen.findByLabelText('Перевод'), 'привет');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');

    await user.click(screen.getByRole('button', { name: 'Далее' }));

    expect(await screen.findByText('Сессия завершена')).toBeInTheDocument();
    expect(screen.getByText('Верно: 1')).toBeInTheDocument();

    await waitFor(async () => {
      const reviews = await db.reviews.toArray();
      expect(reviews).toHaveLength(1);
      expect(reviews[0].correct).toBe(true);
    });
  });
});
```

- [ ] **Step 5: Запустить тесты**

```bash
npm run test -- src/features/study/StudySession.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Подключить `StudySession` в `App.tsx`**

Добавь `import { StudySession } from '@/features/study/StudySession';`, замени строку экрана `study`:

```tsx
{screen === 'study' && <StudySession />}
```

- [ ] **Step 7: Проверить сборку и полный прогон тестов**

```bash
npm run build
npm run test
```

Expected: без ошибок, все тесты зелёные.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add study session with flashcards and session summary"
```

---

### Task 13: Главный экран (`features/home/Dashboard.tsx`)

**Files:**
- Create: `src/features/home/Dashboard.tsx`
- Test: `src/features/home/Dashboard.test.tsx`
- Modify: `src/App.tsx` (подключить `Dashboard` на экране `home`)

**Interfaces:**
- Consumes: `db` из `src/db/db.ts`; `selectDueWords` из `src/lib/srs.ts`; `computeStreak` из `src/lib/stats.ts`; `useUIStore` из `src/store/useUIStore.ts`
- Produces: `export function Dashboard()`

- [ ] **Step 1: Написать падающий тест**

Создай `src/features/home/Dashboard.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { db } from '@/db/db';

describe('Dashboard', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.reviews.clear();
  });

  it('показывает количество слов на сегодня и всего слов', async () => {
    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: Date.now() - 1000,
    });
    await db.words.add({
      term: 'cat',
      translation: 'кот',
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 5,
      repetitions: 1,
      dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
    });

    render(<Dashboard />);

    expect(await screen.findByText(/Слов на сегодня: 1/)).toBeInTheDocument();
    expect(await screen.findByText(/Всего слов: 2/)).toBeInTheDocument();
  });

  it('кнопка "Учить" отключена, если на сегодня нечего повторять', async () => {
    render(<Dashboard />);
    const button = await screen.findByRole('button', { name: 'Учить' });
    expect(button).toBeDisabled();
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что тест падает**

```bash
npm run test -- src/features/home/Dashboard.test.tsx
```

Expected: FAIL — файла ещё нет.

- [ ] **Step 3: Реализовать `src/features/home/Dashboard.tsx`**

```tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import { selectDueWords } from '@/lib/srs';
import { computeStreak } from '@/lib/stats';
import { useUIStore } from '@/store/useUIStore';

export function Dashboard() {
  const words = useLiveQuery(() => db.words.toArray(), []) ?? [];
  const reviews = useLiveQuery(() => db.reviews.toArray(), []) ?? [];
  const setScreen = useUIStore((s) => s.setScreen);

  const now = Date.now();
  const dueCount = selectDueWords(words, now, Number.POSITIVE_INFINITY).length;
  const streak = computeStreak(reviews, now);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4">
        <p>Слов на сегодня: {dueCount}</p>
        <p>Всего слов: {words.length}</p>
        <p>Streak: {streak} дн.</p>
      </div>

      <div className="flex gap-2">
        <Button type="button" disabled={dueCount === 0} onClick={() => setScreen('study')}>
          Учить
        </Button>
        <Button type="button" variant="outline" onClick={() => setScreen('add')}>
          Добавить слово
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

```bash
npm run test -- src/features/home/Dashboard.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Подключить `Dashboard` в `App.tsx`**

Добавь `import { Dashboard } from '@/features/home/Dashboard';`, замени строку экрана `home`:

```tsx
{screen === 'home' && <Dashboard />}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add home dashboard with due count and streak"
```

---

### Task 14: Экран «Статистика» (`features/stats/StatsPage.tsx`)

**Files:**
- Create: `src/features/stats/StatsPage.tsx`
- Test: `src/features/stats/StatsPage.test.tsx`
- Modify: `src/App.tsx` (подключить `StatsPage` на экране `stats`)

**Interfaces:**
- Consumes: `db` из `src/db/db.ts`; `computeAccuracy`, `computeStreak`, `countMastered`, `last30DaysActivity` из `src/lib/stats.ts`
- Produces: `export function StatsPage()`

- [ ] **Step 1: Написать падающий тест**

Создай `src/features/stats/StatsPage.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsPage } from './StatsPage';
import { db } from '@/db/db';

describe('StatsPage', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.reviews.clear();
  });

  it('показывает количество выученных слов и точность', async () => {
    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      easinessFactor: 2.6,
      interval: 25,
      repetitions: 3,
      dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
    });
    await db.reviews.add({ wordId: 1, reviewedAt: Date.now(), correct: true });

    render(<StatsPage />);

    expect(await screen.findByText(/Выучено слов: 1/)).toBeInTheDocument();
    expect(await screen.findByText(/Точность за 7 дней: 100%/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Запустить и убедиться, что тест падает**

```bash
npm run test -- src/features/stats/StatsPage.test.tsx
```

Expected: FAIL — файла ещё нет.

- [ ] **Step 3: Реализовать `src/features/stats/StatsPage.tsx`**

```tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { computeAccuracy, computeStreak, countMastered, last30DaysActivity } from '@/lib/stats';

export function StatsPage() {
  const words = useLiveQuery(() => db.words.toArray(), []) ?? [];
  const reviews = useLiveQuery(() => db.reviews.toArray(), []) ?? [];
  const now = Date.now();

  const mastered = countMastered(words);
  const accuracy7 = computeAccuracy(reviews, 7, now);
  const accuracy30 = computeAccuracy(reviews, 30, now);
  const streak = computeStreak(reviews, now);
  const activity = last30DaysActivity(reviews, now);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4">
        <p>Выучено слов: {mastered}</p>
        <p>Точность за 7 дней: {accuracy7}%</p>
        <p>Точность за 30 дней: {accuracy30}%</p>
        <p>Streak: {streak} дн.</p>
      </div>

      <div>
        <p className="mb-2 text-sm text-muted-foreground">Активность за 30 дней</p>
        <div className="grid grid-cols-10 gap-1">
          {activity.map((active, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-sm ${active ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Запустить тесты и убедиться, что проходят**

```bash
npm run test -- src/features/stats/StatsPage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Подключить `StatsPage` в `App.tsx`**

Добавь `import { StatsPage } from '@/features/stats/StatsPage';`, замени строку экрана `stats`:

```tsx
{screen === 'stats' && <StatsPage />}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add stats screen with accuracy, mastered count and activity grid"
```

---

### Task 15: Финальная проверка

**Files:** без новых файлов — только верификация.

- [ ] **Step 1: Полный прогон тестов**

```bash
npm run test
```

Expected: все тесты во всех файлах проходят.

- [ ] **Step 2: Полная сборка**

```bash
npm run build
```

Expected: сборка без ошибок TypeScript и без ошибок Vite.

- [ ] **Step 3: Ручная проверка в браузере**

```bash
npm run dev
```

Открыть `http://localhost:5173`, вручную пройти путь: добавить слово → перейти в «Мои слова» и убедиться, что оно там → перейти в «Учить», ответить на карточку → увидеть итог сессии с confetti → зайти в «Статистика» и увидеть обновлённые цифры → переключить тему.

- [ ] **Step 4: Commit (если после ручной проверки были правки)**

```bash
git add -A
git commit -m "chore: final verification pass"
```
