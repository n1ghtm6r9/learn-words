# Переработка движка обучения — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить SM-2/Dashboard/Статистику на: двухфазное изучение новых слов (узнавание → активное вспоминание, интерливинг, настраиваемое число повторов), раздел «Повторение» с рейтингом слова 0–100 и алгоритмом забывания (экспоненциальный распад, зависящий от streak), массовое добавление слов через textarea.

**Architecture:** Данные слова хранятся в Dexie с новой схемой (`stage`, `learningPhase`/`phaseStreak` для новых слов; `rating`/`reviewStreak`/`lastReviewedAt` для слов на повторении). Состояние учебной сессии (пул для новых слов, очередь для повторения) живёт локально в компоненте сессии (`useState`, инициализация из Dexie при монтировании) — не в глобальном сторе, поэтому уход с экрана просто размонтирует сессию без риска «залипшего» состояния. Zustand-стор хранит только screen/theme/настройки (phaseARepeats/phaseBRepeats).

**Tech Stack:** Vite, React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui, Zustand, Dexie.js + dexie-react-hooks, Motion, canvas-confetti, Web Speech API, Vitest + React Testing Library + fake-indexeddb. Без изменений от текущего стека.

**Spec:** `docs/superpowers/specs/2026-08-18-learning-engine-rewrite-design.md`

## Global Constraints

- Каждый экспортируемый тип/функция/константа — в своём файле (`~/.claude/CLAUDE.md`: «One thing per file»). Приватные хелперы, используемые только одним файлом, могут оставаться внутри него.
- Никакого бэкенда, сети, синхронизации.
- Все тексты интерфейса — на русском.
- Путь до алиаса `@` всегда указывает на `src/`.
- Алгоритмическая логика (`lib/*`) — чистые функции без побочных эффектов, обязательно с юнит-тестами по TDD.
- Существующие данные при апгрейде схемы Dexie не теряются — только мигрируют (см. Task 1).
- Не изобретать новые визуальные токены — переиспользовать существующую палитру (`text-status-mastered` = зелёный/выучено, `text-status-learning` = жёлтый/учу, `text-destructive` = красный) для 🟢🟡🔴.

---

### Task 1: Модель данных — `Word`, `VocabDB` (schema v2 + миграция), `createWord`

**Files:**
- Modify: `src/db/word.type.ts`
- Modify: `src/db/VocabDB.ts`
- Modify: `src/db/createWord.ts`
- Modify: `src/db/db.test.ts`
- Modify: `src/db/createWord.test.ts`
- Delete: `src/db/reviewLog.type.ts`

**Interfaces:**
- Produces: `export type WordStage = 'new' | 'review'` and `export type LearningPhase = 'A' | 'B'` (внутри `word.type.ts`, реэкспортируются вместе с `Word`), `export interface Word { id?, term, translation, createdAt, stage, learningPhase, phaseStreak, rating, reviewStreak, lastReviewedAt? }`.

- [ ] **Step 1: Переписать `src/db/word.type.ts`**

```typescript
export type WordStage = 'new' | 'review';
export type LearningPhase = 'A' | 'B';

export interface Word {
  id?: number;
  term: string;
  translation: string;
  createdAt: number;

  stage: WordStage;

  learningPhase: LearningPhase;
  phaseStreak: number;

  rating: number;
  reviewStreak: number;

  lastReviewedAt?: number;
}
```

- [ ] **Step 2: Переписать `src/db/VocabDB.ts`**

```typescript
import Dexie, { type Table } from 'dexie';
import type { Word } from './word.type';

interface LegacyWordV1 {
  interval?: number;
  easinessFactor?: number;
  repetitions?: number;
  dueDate?: number;
}

export class VocabDB extends Dexie {
  words!: Table<Word, number>;

  constructor() {
    super('vocab-db');

    this.version(1).stores({
      words: '++id, term, dueDate',
      reviews: '++id, wordId, reviewedAt',
    });

    this.version(2)
      .stores({
        words: '++id, term, stage',
        reviews: null,
      })
      .upgrade(async (tx) => {
        await tx
          .table<Word & LegacyWordV1, number>('words')
          .toCollection()
          .modify((word) => {
            const legacyInterval = word.interval ?? 0;
            word.stage = 'review';
            word.learningPhase = 'B';
            word.phaseStreak = 0;
            word.rating = legacyInterval >= 21 ? 80 : legacyInterval >= 6 ? 60 : 40;
            word.reviewStreak = 0;
            delete word.easinessFactor;
            delete word.interval;
            delete word.repetitions;
            delete word.dueDate;
          });
      });
  }
}
```

- [ ] **Step 3: Переписать `src/db/createWord.ts`**

```typescript
import type { Word } from './word.type';

export function createWord(term: string, translation: string): Word {
  return {
    term,
    translation,
    createdAt: Date.now(),
    stage: 'new',
    learningPhase: 'A',
    phaseStreak: 0,
    rating: 0,
    reviewStreak: 0,
  };
}
```

- [ ] **Step 4: Удалить `src/db/reviewLog.type.ts`**

```bash
rm src/db/reviewLog.type.ts
```

- [ ] **Step 5: Переписать `src/db/createWord.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import { createWord } from './createWord';

describe('createWord', () => {
  it('создаёт слово, готовое к Фазе A', () => {
    const word = createWord('hello', 'привет');

    expect(word.term).toBe('hello');
    expect(word.translation).toBe('привет');
    expect(word.stage).toBe('new');
    expect(word.learningPhase).toBe('A');
    expect(word.phaseStreak).toBe(0);
  });
});
```

- [ ] **Step 6: Переписать `src/db/db.test.ts`**

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { createWord } from './createWord';

describe('VocabDB', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('persists and retrieves a word via Dexie', async () => {
    const word = createWord('cat', 'кот');
    const id = await db.words.add(word);

    const stored = await db.words.get(id);
    expect(stored?.term).toBe('cat');
    expect(stored?.stage).toBe('new');
  });

  it('filters words by stage using the stage index', async () => {
    await db.words.add(createWord('cat', 'кот'));
    await db.words.add({ ...createWord('dog', 'собака'), stage: 'review', rating: 70 });

    const newWords = await db.words.where('stage').equals('new').toArray();
    const reviewWords = await db.words.where('stage').equals('review').toArray();

    expect(newWords).toHaveLength(1);
    expect(newWords[0].term).toBe('cat');
    expect(reviewWords).toHaveLength(1);
    expect(reviewWords[0].term).toBe('dog');
  });
});
```

- [ ] **Step 7: Запустить тесты и починить всё, что ссылается на старые поля**

```bash
npm run test
```

Expected: `db.test.ts`/`createWord.test.ts` проходят. Другие файлы (WordForm.tsx, WordItem.tsx и т.д.) на этом шаге ещё могут падать по типам — это ожидаемо, они правятся в следующих задачах. Просто убедись, что тест-раннер вообще стартует и два новых файла зелёные:

```bash
npm run test -- src/db/db.test.ts src/db/createWord.test.ts
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: rewrite Word model for stage/phase/rating learning engine"
```

---

### Task 2: Убрать старый движок (`lib/time.ts` + удаление SM-2/статистики/mastery)

**Files:**
- Create: `src/lib/time.ts`
- Delete: `src/lib/srs.ts`, `src/lib/srs.test.ts`
- Delete: `src/lib/stats.ts`, `src/lib/stats.test.ts`
- Delete: `src/lib/mastery.ts`, `src/lib/mastery.test.ts`, `src/lib/masteryLabel.ts`, `src/lib/masteryStatus.type.ts`
- Delete: `src/lib/statusDotClass.ts`
- Delete: `src/store/studySessionState.type.ts`

**Interfaces:**
- Produces: `export const DAY_MS: number` (единственное, что реально переиспользуется из старого `srs.ts`).

- [ ] **Step 1: Создать `src/lib/time.ts`**

```typescript
export const DAY_MS = 24 * 60 * 60 * 1000;
```

- [ ] **Step 2: Удалить старые файлы движка**

```bash
rm src/lib/srs.ts src/lib/srs.test.ts
rm src/lib/stats.ts src/lib/stats.test.ts
rm src/lib/mastery.ts src/lib/mastery.test.ts src/lib/masteryLabel.ts src/lib/masteryStatus.type.ts
rm src/lib/statusDotClass.ts
rm src/store/studySessionState.type.ts
```

- [ ] **Step 3: Найти всех потребителей удалённых модулей (они будут исправлены в последующих задачах — это просто разведка)**

```bash
grep -rln "lib/srs\|lib/stats\|lib/mastery\|lib/statusDotClass\|studySessionState.type" src --include="*.ts" --include="*.tsx"
```

Ожидаются ссылки из: `src/features/home/*`, `src/features/stats/*`, `src/features/study/*`, `src/features/words/WordItem.tsx`, `src/features/words/WordList.tsx`, `src/store/useUIStore.ts`. Все они переписываются или удаляются в задачах 6–15 — на этом шаге проект **не обязан собираться**, ничего не чини вручную здесь.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove SM-2, old stats and mastery-status modules"
```

---

### Task 3: Алгоритм рейтинга — `lib/rating` (TDD, критичная логика)

**Files:**
- Create: `src/lib/clamp.ts`
- Create: `src/lib/ratingState.type.ts`
- Create: `src/lib/halfLifeDays.ts`
- Create: `src/lib/effectiveRating.ts`
- Create: `src/lib/applyReviewOutcome.ts`
- Test: `src/lib/halfLifeDays.test.ts`
- Test: `src/lib/effectiveRating.test.ts`
- Test: `src/lib/applyReviewOutcome.test.ts`

**Interfaces:**
- Consumes: `DAY_MS` из `src/lib/time.ts`; `MatchVerdict` из `src/lib/fuzzyMatch.ts`
- Produces:
  - `export function clamp(value: number, min: number, max: number): number`
  - `export interface RatingState { rating: number; reviewStreak: number; lastReviewedAt?: number; }`
  - `export function halfLifeDays(reviewStreak: number): number`
  - `export function effectiveRating(state: RatingState, now: number): number`
  - `export function applyReviewOutcome(state: RatingState, verdict: MatchVerdict, now: number): RatingState`

- [ ] **Step 1: Создать `src/lib/clamp.ts`**

```typescript
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
```

- [ ] **Step 2: Создать `src/lib/ratingState.type.ts`**

```typescript
export interface RatingState {
  rating: number;
  reviewStreak: number;
  lastReviewedAt?: number;
}
```

- [ ] **Step 3: Написать падающий тест для `halfLifeDays`**

Создай `src/lib/halfLifeDays.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { halfLifeDays } from './halfLifeDays';

describe('halfLifeDays', () => {
  it('растёт от reviewStreak: 2 дня при streak=0, 17 дней при streak=5', () => {
    expect(halfLifeDays(0)).toBe(2);
    expect(halfLifeDays(5)).toBe(17);
  });
});
```

Запусти и убедись, что падает (`npm run test -- src/lib/halfLifeDays.test.ts`), затем реализуй:

- [ ] **Step 4: Создать `src/lib/halfLifeDays.ts`**

```typescript
export function halfLifeDays(reviewStreak: number): number {
  return 2 + reviewStreak * 3;
}
```

Запусти тест снова — должен пройти.

- [ ] **Step 5: Написать падающие тесты для `effectiveRating`**

Создай `src/lib/effectiveRating.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { effectiveRating } from './effectiveRating';
import { DAY_MS } from './time';

describe('effectiveRating', () => {
  it('возвращает исходный rating без распада, если lastReviewedAt не задан', () => {
    expect(effectiveRating({ rating: 70, reviewStreak: 0 }, 1000)).toBe(70);
  });

  it('возвращает исходный rating без распада сразу после повтора (elapsed=0)', () => {
    const now = 1000;
    expect(effectiveRating({ rating: 70, reviewStreak: 0, lastReviewedAt: now }, now)).toBe(70);
  });

  it('распадается вдвое ровно через один период полураспада', () => {
    const now = 10 * DAY_MS;
    const lastReviewedAt = now - 2 * DAY_MS; // halfLifeDays(0) === 2
    expect(effectiveRating({ rating: 80, reviewStreak: 0, lastReviewedAt }, now)).toBe(40);
  });

  it('распадается медленнее при большем reviewStreak', () => {
    const now = 10 * DAY_MS;
    const lastReviewedAt = now - 2 * DAY_MS;
    const slow = effectiveRating({ rating: 80, reviewStreak: 5, lastReviewedAt }, now);
    const fast = effectiveRating({ rating: 80, reviewStreak: 0, lastReviewedAt }, now);
    expect(slow).toBeGreaterThan(fast);
  });

  it('не опускается ниже 0 при очень старом повторе', () => {
    const now = 1000 * DAY_MS;
    expect(effectiveRating({ rating: 50, reviewStreak: 0, lastReviewedAt: 0 }, now)).toBe(0);
  });
});
```

Запусти и убедись, что падает.

- [ ] **Step 6: Создать `src/lib/effectiveRating.ts`**

```typescript
import { clamp } from './clamp';
import { halfLifeDays } from './halfLifeDays';
import { DAY_MS } from './time';
import type { RatingState } from './ratingState.type';

export function effectiveRating(state: RatingState, now: number): number {
  if (state.lastReviewedAt == null) {
    return clamp(Math.round(state.rating), 0, 100);
  }

  const daysSince = (now - state.lastReviewedAt) / DAY_MS;
  const decayed = state.rating * 0.5 ** (daysSince / halfLifeDays(state.reviewStreak));
  return clamp(Math.round(decayed), 0, 100);
}
```

Запусти тесты снова — должны пройти.

- [ ] **Step 7: Написать падающие тесты для `applyReviewOutcome`**

Создай `src/lib/applyReviewOutcome.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { applyReviewOutcome } from './applyReviewOutcome';
import { DAY_MS } from './time';

describe('applyReviewOutcome', () => {
  const now = 5 * DAY_MS;

  it('correct: +15 к рейтингу, streak увеличивается', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 2 }, 'correct', now);
    expect(next.rating).toBe(65);
    expect(next.reviewStreak).toBe(3);
    expect(next.lastReviewedAt).toBe(now);
  });

  it('correct: не превышает 100', () => {
    const next = applyReviewOutcome({ rating: 95, reviewStreak: 0 }, 'correct', now);
    expect(next.rating).toBe(100);
  });

  it('almost: +5 к рейтингу, streak сбрасывается', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'almost', now);
    expect(next.rating).toBe(55);
    expect(next.reviewStreak).toBe(0);
  });

  it('wrong: -25 от рейтинга, streak сбрасывается', () => {
    const next = applyReviewOutcome({ rating: 50, reviewStreak: 3 }, 'wrong', now);
    expect(next.rating).toBe(25);
    expect(next.reviewStreak).toBe(0);
  });

  it('wrong: не опускается ниже 0', () => {
    const next = applyReviewOutcome({ rating: 10, reviewStreak: 0 }, 'wrong', now);
    expect(next.rating).toBe(0);
  });

  it('считает от эффективного (распавшегося) рейтинга, а не от устаревшего сохранённого', () => {
    const lastReviewedAt = now - 10 * DAY_MS;
    const next = applyReviewOutcome({ rating: 80, reviewStreak: 0, lastReviewedAt }, 'correct', now);
    expect(next.rating).toBeLessThan(80);
  });
});
```

Запусти и убедись, что падает.

- [ ] **Step 8: Создать `src/lib/applyReviewOutcome.ts`**

```typescript
import { clamp } from './clamp';
import { effectiveRating } from './effectiveRating';
import type { RatingState } from './ratingState.type';
import type { MatchVerdict } from './fuzzyMatch';

export function applyReviewOutcome(state: RatingState, verdict: MatchVerdict, now: number): RatingState {
  const current = effectiveRating(state, now);

  if (verdict === 'correct') {
    return { rating: clamp(current + 15, 0, 100), reviewStreak: state.reviewStreak + 1, lastReviewedAt: now };
  }
  if (verdict === 'almost') {
    return { rating: clamp(current + 5, 0, 100), reviewStreak: 0, lastReviewedAt: now };
  }
  return { rating: clamp(current - 25, 0, 100), reviewStreak: 0, lastReviewedAt: now };
}
```

- [ ] **Step 9: Запустить все тесты задачи и убедиться, что зелёные**

```bash
npm run test -- src/lib/halfLifeDays.test.ts src/lib/effectiveRating.test.ts src/lib/applyReviewOutcome.test.ts
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: implement rating/forgetting-curve algorithm"
```

---

### Task 4: Цвет рейтинга — `lib/ratingColor` (🔴🟡🟢)

**Files:**
- Create: `src/lib/ratingColor.type.ts`
- Create: `src/lib/ratingColor.ts`
- Create: `src/lib/ratingDotClass.ts`
- Create: `src/lib/ratingTextClass.ts`
- Test: `src/lib/ratingColor.test.ts`

**Interfaces:**
- Produces:
  - `export type RatingColor = 'red' | 'yellow' | 'green'`
  - `export function ratingColor(effectiveRating: number): RatingColor`
  - `export const RATING_DOT_CLASS: Record<RatingColor, string>` (для точек-индикаторов, `bg-*`)
  - `export const RATING_TEXT_CLASS: Record<RatingColor, string>` (для числового значения рейтинга, `text-*`)

- [ ] **Step 1: Создать `src/lib/ratingColor.type.ts`**

```typescript
export type RatingColor = 'red' | 'yellow' | 'green';
```

- [ ] **Step 2: Написать падающий тест**

Создай `src/lib/ratingColor.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { ratingColor } from './ratingColor';

describe('ratingColor', () => {
  it('green при >= 67', () => {
    expect(ratingColor(67)).toBe('green');
    expect(ratingColor(100)).toBe('green');
  });

  it('yellow при 34..66', () => {
    expect(ratingColor(34)).toBe('yellow');
    expect(ratingColor(66)).toBe('yellow');
  });

  it('red при < 34', () => {
    expect(ratingColor(33)).toBe('red');
    expect(ratingColor(0)).toBe('red');
  });
});
```

Запусти, убедись, что падает.

- [ ] **Step 3: Создать `src/lib/ratingColor.ts`**

```typescript
import type { RatingColor } from './ratingColor.type';

export function ratingColor(effectiveRating: number): RatingColor {
  if (effectiveRating >= 67) return 'green';
  if (effectiveRating >= 34) return 'yellow';
  return 'red';
}
```

- [ ] **Step 4: Создать `src/lib/ratingDotClass.ts`**

```typescript
import type { RatingColor } from './ratingColor.type';

export const RATING_DOT_CLASS: Record<RatingColor, string> = {
  green: 'bg-status-mastered',
  yellow: 'bg-status-learning',
  red: 'bg-destructive',
};
```

- [ ] **Step 5: Создать `src/lib/ratingTextClass.ts`**

```typescript
import type { RatingColor } from './ratingColor.type';

export const RATING_TEXT_CLASS: Record<RatingColor, string> = {
  green: 'text-status-mastered',
  yellow: 'text-status-learning',
  red: 'text-destructive',
};
```

- [ ] **Step 6: Запустить тесты**

```bash
npm run test -- src/lib/ratingColor.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add rating color thresholds and class maps"
```

---

### Task 5: Разбор массового ввода — `lib/parseWordLines` (TDD)

**Files:**
- Create: `src/lib/parsedWordLine.type.ts`
- Create: `src/lib/parseWordLines.ts`
- Test: `src/lib/parseWordLines.test.ts`

**Interfaces:**
- Produces:
  - `export interface ParsedWordLine { term: string; translation: string; }`
  - `export function parseWordLines(text: string): { valid: ParsedWordLine[]; invalidLines: string[] }`

- [ ] **Step 1: Создать `src/lib/parsedWordLine.type.ts`**

```typescript
export interface ParsedWordLine {
  term: string;
  translation: string;
}
```

- [ ] **Step 2: Написать падающие тесты**

Создай `src/lib/parseWordLines.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { parseWordLines } from './parseWordLines';

describe('parseWordLines', () => {
  it('разбирает строки по дефису', () => {
    const result = parseWordLines('hello - привет\ncat - кот');
    expect(result.valid).toEqual([
      { term: 'hello', translation: 'привет' },
      { term: 'cat', translation: 'кот' },
    ]);
    expect(result.invalidLines).toHaveLength(0);
  });

  it('поддерживает разные разделители: длинное/короткое тире, =, :, таб', () => {
    const result = parseWordLines('a - b\nc – d\ne — f\ng=h\ni:j\nk\tl');
    expect(result.valid).toEqual([
      { term: 'a', translation: 'b' },
      { term: 'c', translation: 'd' },
      { term: 'e', translation: 'f' },
      { term: 'g', translation: 'h' },
      { term: 'i', translation: 'j' },
      { term: 'k', translation: 'l' },
    ]);
  });

  it('обрезает пробелы по краям слова и перевода', () => {
    const result = parseWordLines('  hello   -   привет  ');
    expect(result.valid).toEqual([{ term: 'hello', translation: 'привет' }]);
  });

  it('использует первое вхождение разделителя, остальное уходит в перевод', () => {
    const result = parseWordLines('well-known - хорошо известный');
    expect(result.valid).toEqual([{ term: 'well', translation: 'known - хорошо известный' }]);
  });

  it('игнорирует пустые строки', () => {
    const result = parseWordLines('hello - привет\n\n\ncat - кот');
    expect(result.valid).toHaveLength(2);
  });

  it('помечает строки без разделителя как невалидные', () => {
    const result = parseWordLines('hello privet');
    expect(result.valid).toHaveLength(0);
    expect(result.invalidLines).toEqual(['hello privet']);
  });

  it('помечает строки с пустой частью (до или после разделителя) как невалидные', () => {
    const result = parseWordLines('hello -\n- привет');
    expect(result.valid).toHaveLength(0);
    expect(result.invalidLines).toEqual(['hello -', '- привет']);
  });
});
```

Запусти и убедись, что падает.

- [ ] **Step 3: Создать `src/lib/parseWordLines.ts`**

```typescript
import type { ParsedWordLine } from './parsedWordLine.type';

const DELIMITERS = ['-', '–', '—', '=', ':', '\t'];

function splitLine(line: string): ParsedWordLine | null {
  let delimiterIndex = -1;
  let delimiterLength = 1;

  for (const delimiter of DELIMITERS) {
    const index = line.indexOf(delimiter);
    if (index !== -1 && (delimiterIndex === -1 || index < delimiterIndex)) {
      delimiterIndex = index;
      delimiterLength = delimiter.length;
    }
  }

  if (delimiterIndex === -1) return null;

  const term = line.slice(0, delimiterIndex).trim();
  const translation = line.slice(delimiterIndex + delimiterLength).trim();

  if (!term || !translation) return null;

  return { term, translation };
}

export function parseWordLines(text: string): { valid: ParsedWordLine[]; invalidLines: string[] } {
  const valid: ParsedWordLine[] = [];
  const invalidLines: string[] = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const parsed = splitLine(line);
    if (parsed) {
      valid.push(parsed);
    } else {
      invalidLines.push(line);
    }
  }

  return { valid, invalidLines };
}
```

- [ ] **Step 4: Запустить тесты**

```bash
npm run test -- src/lib/parseWordLines.test.ts
```

Expected: все проходят, включая тест на "well-known" (первый дефис внутри слова — ожидаемо режет неидеально, это документированное поведение, не баг).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement bulk word-line parser"
```

---

### Task 6: Стор — `useUIStore` (screen, theme, настройки N/M)

**Files:**
- Modify: `src/store/screen.type.ts`
- Modify: `src/store/useUIStore.ts`
- Modify: `src/store/useUIStore.test.ts`

**Interfaces:**
- Produces:
  - `export type Screen = 'newWords' | 'review' | 'add' | 'words' | 'settings'`
  - `useUIStore` со полями/методами: `screen`, `setScreen(screen)`, `theme`, `toggleTheme()`, `phaseARepeats`, `phaseBRepeats`, `setPhaseARepeats(n)`, `setPhaseBRepeats(n)`

- [ ] **Step 1: Переписать `src/store/screen.type.ts`**

```typescript
export type Screen = 'newWords' | 'review' | 'add' | 'words' | 'settings';
```

- [ ] **Step 2: Переписать `src/store/useUIStore.ts`**

```typescript
import { create } from 'zustand';
import type { Screen } from './screen.type';
import type { Theme } from './theme.type';

const DEFAULT_PHASE_REPEATS = 3;

interface UIStore {
  screen: Screen;
  setScreen: (screen: Screen) => void;

  theme: Theme;
  toggleTheme: () => void;

  phaseARepeats: number;
  setPhaseARepeats: (value: number) => void;

  phaseBRepeats: number;
  setPhaseBRepeats: (value: number) => void;
}

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
}

function readInitialNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(key);
  const parsed = stored ? Number(stored) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const useUIStore = create<UIStore>((set) => ({
  screen: 'newWords',
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

  phaseARepeats: readInitialNumber('phaseARepeats', DEFAULT_PHASE_REPEATS),
  setPhaseARepeats: (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('phaseARepeats', String(value));
    }
    set({ phaseARepeats: value });
  },

  phaseBRepeats: readInitialNumber('phaseBRepeats', DEFAULT_PHASE_REPEATS),
  setPhaseBRepeats: (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('phaseBRepeats', String(value));
    }
    set({ phaseBRepeats: value });
  },
}));
```

- [ ] **Step 3: Переписать `src/store/useUIStore.test.ts`**

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ screen: 'newWords', theme: 'light', phaseARepeats: 3, phaseBRepeats: 3 });
    window.localStorage.clear();
  });

  it('setScreen меняет текущий экран', () => {
    useUIStore.getState().setScreen('review');
    expect(useUIStore.getState().screen).toBe('review');
  });

  it('toggleTheme переключает тему и сохраняет в localStorage', () => {
    const before = useUIStore.getState().theme;
    useUIStore.getState().toggleTheme();
    const after = useUIStore.getState().theme;

    expect(after).not.toBe(before);
    expect(window.localStorage.getItem('theme')).toBe(after);
  });

  it('setPhaseARepeats обновляет значение и сохраняет в localStorage', () => {
    useUIStore.getState().setPhaseARepeats(5);
    expect(useUIStore.getState().phaseARepeats).toBe(5);
    expect(window.localStorage.getItem('phaseARepeats')).toBe('5');
  });

  it('setPhaseBRepeats обновляет значение и сохраняет в localStorage', () => {
    useUIStore.getState().setPhaseBRepeats(7);
    expect(useUIStore.getState().phaseBRepeats).toBe(7);
    expect(window.localStorage.getItem('phaseBRepeats')).toBe('7');
  });
});
```

- [ ] **Step 4: Запустить тесты**

```bash
npm run test -- src/store/useUIStore.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: rework UI store for new screens and phase-repeat settings"
```

---

### Task 7: `RecallCard` — общая карточка (Фаза B и Повторение)

**Files:**
- Create: `src/features/study/RecallCard.tsx`
- Test: `src/features/study/RecallCard.test.tsx`

**Interfaces:**
- Consumes: `matchAnswer`, `type MatchVerdict` из `@/lib/fuzzyMatch`; `speak`, `isSpeechSupported` из `@/lib/tts`
- Produces: `export interface RecallCardProps { translation: string; expectedTerm: string; onAnswer: (verdict: MatchVerdict) => void; }`, `export function RecallCard(props: RecallCardProps)`

Карточка показывает **только перевод**, пользователь вводит слово. После проверки — фидбек (цвет по `MatchVerdict`, переиспользуя семантику `text-status-mastered`/`text-status-learning`/`text-destructive`, как в старом `Flashcard.tsx`) и кнопка «Далее», по нажатию которой вызывается `onAnswer(verdict)` — вся логика начисления рейтинга/фазы остаётся на стороне родителя (`NewWordsSession`/`ReviewSession`), `RecallCard` ничего не пишет в Dexie сам.

- [ ] **Step 1: Написать падающий тест**

Создай `src/features/study/RecallCard.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecallCard } from './RecallCard';

describe('RecallCard', () => {
  it('показывает перевод, принимает ввод слова и сообщает вердикт по кнопке Далее', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={onAnswer} />);

    expect(screen.getByText('привет')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(onAnswer).toHaveBeenCalledWith('correct');
  });

  it('при неверном ответе показывает правильное слово и сообщает вердикт wrong', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="кот" expectedTerm="cat" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('cat');

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(onAnswer).toHaveBeenCalledWith('wrong');
  });
});
```

Запусти и убедись, что падает (файла компонента ещё нет).

- [ ] **Step 2: Реализовать `src/features/study/RecallCard.tsx`**

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CARD_CLASS } from '@/lib/cardClass';
import { matchAnswer, type MatchVerdict } from '@/lib/fuzzyMatch';
import { speak, isSpeechSupported } from '@/lib/tts';

export interface RecallCardProps {
  translation: string;
  expectedTerm: string;
  onAnswer: (verdict: MatchVerdict) => void;
}

interface Feedback {
  verdict: MatchVerdict;
  correctAnswer: string;
}

const FEEDBACK_TEXT: Record<MatchVerdict, (correct: string) => string> = {
  correct: () => 'Верно!',
  almost: (correct) => `Почти! Правильное слово: ${correct}`,
  wrong: (correct) => `Неверно. Правильное слово: ${correct}`,
};

const FEEDBACK_COLOR: Record<MatchVerdict, string> = {
  correct: 'text-status-mastered',
  almost: 'text-status-learning',
  wrong: 'text-destructive',
};

export function RecallCard({ translation, expectedTerm, onAnswer }: RecallCardProps) {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function handleCheck(event: React.FormEvent) {
    event.preventDefault();
    const verdict = matchAnswer(input, expectedTerm);
    setFeedback({ verdict, correctAnswer: expectedTerm });
  }

  function handleNext() {
    if (!feedback) return;
    onAnswer(feedback.verdict);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${CARD_CLASS} flex flex-col gap-5 p-6`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-4">
        <span className="font-mono text-2xl font-semibold tracking-tight">{translation}</span>
        {isSpeechSupported() && (
          <button
            type="button"
            aria-label="Озвучить"
            onClick={() => speak(expectedTerm)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
          >
            <Volume2 className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {!feedback ? (
        <form onSubmit={handleCheck} className="flex flex-col gap-3">
          <Input aria-label="Слово" value={input} onChange={(e) => setInput(e.target.value)} autoFocus className="font-mono" />
          <Button type="submit">Проверить</Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p data-testid="feedback" className={`text-sm font-medium ${FEEDBACK_COLOR[feedback.verdict]}`}>
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

- [ ] **Step 3: Запустить тесты**

```bash
npm run test -- src/features/study/RecallCard.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add shared RecallCard (Phase B / Review interaction)"
```

---

### Task 8: `RecognitionCard` — карточка Фазы A

**Files:**
- Create: `src/features/study/RecognitionCard.tsx`
- Test: `src/features/study/RecognitionCard.test.tsx`

**Interfaces:**
- Consumes: `matchAnswer`, `type MatchVerdict` из `@/lib/fuzzyMatch`; `speak`, `isSpeechSupported` из `@/lib/tts`
- Produces: `export interface RecognitionCardProps { term: string; translation: string; onAnswer: (verdict: MatchVerdict) => void; }`, `export function RecognitionCard(props: RecognitionCardProps)`

Показывает слово **и** перевод одновременно (оба видны сразу), пользователь вводит слово — на узнавание/копирование написания, а не вспоминание.

- [ ] **Step 1: Написать падающий тест**

Создай `src/features/study/RecognitionCard.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecognitionCard } from './RecognitionCard';

describe('RecognitionCard', () => {
  it('показывает и слово, и перевод одновременно, принимает ввод слова', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecognitionCard term="hello" translation="привет" onAnswer={onAnswer} />);

    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(onAnswer).toHaveBeenCalledWith('correct');
  });
});
```

Запусти и убедись, что падает.

- [ ] **Step 2: Реализовать `src/features/study/RecognitionCard.tsx`**

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CARD_CLASS } from '@/lib/cardClass';
import { matchAnswer, type MatchVerdict } from '@/lib/fuzzyMatch';
import { speak, isSpeechSupported } from '@/lib/tts';

export interface RecognitionCardProps {
  term: string;
  translation: string;
  onAnswer: (verdict: MatchVerdict) => void;
}

interface Feedback {
  verdict: MatchVerdict;
}

const FEEDBACK_TEXT: Record<MatchVerdict, string> = {
  correct: 'Верно!',
  almost: 'Почти! Проверь написание ещё раз.',
  wrong: 'Неверно. Посмотри на слово выше и попробуй снова.',
};

const FEEDBACK_COLOR: Record<MatchVerdict, string> = {
  correct: 'text-status-mastered',
  almost: 'text-status-learning',
  wrong: 'text-destructive',
};

export function RecognitionCard({ term, translation, onAnswer }: RecognitionCardProps) {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function handleCheck(event: React.FormEvent) {
    event.preventDefault();
    const verdict = matchAnswer(input, term);
    setFeedback({ verdict });
  }

  function handleNext() {
    if (!feedback) return;
    onAnswer(feedback.verdict);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${CARD_CLASS} flex flex-col gap-5 p-6`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-2xl font-semibold tracking-tight">{term}</span>
          <span className="text-sm text-muted-foreground">{translation}</span>
        </div>
        {isSpeechSupported() && (
          <button
            type="button"
            aria-label="Озвучить"
            onClick={() => speak(term)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
          >
            <Volume2 className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {!feedback ? (
        <form onSubmit={handleCheck} className="flex flex-col gap-3">
          <Input aria-label="Слово" value={input} onChange={(e) => setInput(e.target.value)} autoFocus className="font-mono" />
          <Button type="submit">Проверить</Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p data-testid="feedback" className={`text-sm font-medium ${FEEDBACK_COLOR[feedback.verdict]}`}>
            {FEEDBACK_TEXT[feedback.verdict]}
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

- [ ] **Step 3: Запустить тесты**

```bash
npm run test -- src/features/study/RecognitionCard.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add RecognitionCard (Phase A interaction)"
```

---

### Task 9: `NewWordsSession` — интерливинг-сессия новых слов

**Files:**
- Create: `src/features/newWords/NewWordsSummary.tsx`
- Create: `src/features/newWords/NewWordsSession.tsx`
- Test: `src/features/newWords/NewWordsSession.test.tsx`

**Interfaces:**
- Consumes: `db` из `@/db/db`; `type Word` из `@/db/word.type`; `RecognitionCard` из `@/features/study/RecognitionCard`; `RecallCard` из `@/features/study/RecallCard`; `useUIStore` (`phaseARepeats`, `phaseBRepeats`, `setScreen`) из `@/store/useUIStore`
- Produces: `export function NewWordsSummary({ learnedCount, onFinish }: { learnedCount: number; onFinish: () => void })`, `export function NewWordsSession()`

- [ ] **Step 1: Реализовать `src/features/newWords/NewWordsSummary.tsx`**

```tsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const CONFETTI_COLORS = ['#3f7d70', '#c9a24a', '#f5f1e4', '#2f6b5e'];

interface NewWordsSummaryProps {
  learnedCount: number;
  onFinish: () => void;
}

export function NewWordsSummary({ learnedCount, onFinish }: NewWordsSummaryProps) {
  useEffect(() => {
    void confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
  }, []);

  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center">
      <PartyPopper className="h-7 w-7 text-status-mastered" aria-hidden="true" />
      <h2 className="text-lg font-semibold">Новые слова выучены</h2>
      <p className="font-mono text-sm text-muted-foreground">Выучено слов: {learnedCount}</p>
      <Button type="button" onClick={onFinish} className="w-full">
        Готово
      </Button>
    </Card>
  );
}
```

- [ ] **Step 2: Реализовать `src/features/newWords/NewWordsSession.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import type { Word } from '@/db/word.type';
import type { MatchVerdict } from '@/lib/fuzzyMatch';
import { useUIStore } from '@/store/useUIStore';
import { RecognitionCard } from '@/features/study/RecognitionCard';
import { RecallCard } from '@/features/study/RecallCard';
import { NewWordsSummary } from './NewWordsSummary';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function NewWordsSession() {
  const [pool, setPool] = useState<Word[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const phaseARepeats = useUIStore((s) => s.phaseARepeats);
  const phaseBRepeats = useUIStore((s) => s.phaseBRepeats);
  const setScreen = useUIStore((s) => s.setScreen);

  useEffect(() => {
    let cancelled = false;
    void db.words
      .where('stage')
      .equals('new')
      .toArray()
      .then((words) => {
        if (!cancelled) setPool(shuffle(words));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAnswer(word: Word, verdict: MatchVerdict) {
    const wordId = word.id;
    if (!pool || wordId == null) return;

    const advances = verdict === 'correct' || verdict === 'almost';
    const nextStreak = advances ? word.phaseStreak + 1 : 0;

    let updates: Partial<Word>;
    let graduated = false;

    if (!advances) {
      updates = { phaseStreak: 0 };
    } else if (word.learningPhase === 'A' && nextStreak >= phaseARepeats) {
      updates = { learningPhase: 'B', phaseStreak: 0 };
    } else if (word.learningPhase === 'B' && nextStreak >= phaseBRepeats) {
      updates = { stage: 'review', rating: 70, reviewStreak: 0, learningPhase: 'A', phaseStreak: 0 };
      graduated = true;
    } else {
      updates = { phaseStreak: nextStreak };
    }

    await db.words.update(wordId, updates);

    if (graduated) {
      const remaining = pool.filter((w) => w.id !== wordId);
      setPool(remaining);
      setCursor((c) => (remaining.length > 0 ? c % remaining.length : 0));
      setLearnedCount((n) => n + 1);
    } else {
      setPool(pool.map((w) => (w.id === wordId ? { ...w, ...updates } : w)));
      setCursor((c) => (c + 1) % pool.length);
    }
  }

  if (pool === null) {
    return <p className="text-sm text-muted-foreground">Загрузка...</p>;
  }

  if (pool.length === 0) {
    if (learnedCount > 0) {
      return <NewWordsSummary learnedCount={learnedCount} onFinish={() => setScreen('review')} />;
    }
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Нет новых слов — добавьте немного!</p>
        <Button type="button" onClick={() => setScreen('add')}>
          Добавить
        </Button>
      </div>
    );
  }

  const current = pool[cursor % pool.length];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-right font-mono text-xs text-muted-foreground">Осталось слов: {pool.length}</p>
      {current.learningPhase === 'A' ? (
        <RecognitionCard
          key={`${current.id}-A-${current.phaseStreak}`}
          term={current.term}
          translation={current.translation}
          onAnswer={(verdict) => void handleAnswer(current, verdict)}
        />
      ) : (
        <RecallCard
          key={`${current.id}-B-${current.phaseStreak}`}
          translation={current.translation}
          expectedTerm={current.term}
          onAnswer={(verdict) => void handleAnswer(current, verdict)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Написать тест на полный цикл (Фаза A → Фаза B → переход в Повторение)**

Создай `src/features/newWords/NewWordsSession.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewWordsSession } from './NewWordsSession';
import { db } from '@/db/db';
import { createWord } from '@/db/createWord';
import { useUIStore } from '@/store/useUIStore';

describe('NewWordsSession', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ phaseARepeats: 1, phaseBRepeats: 1, screen: 'newWords' });
  });

  it('показывает пустое состояние, если новых слов нет', async () => {
    render(<NewWordsSession />);
    expect(await screen.findByText('Нет новых слов — добавьте немного!')).toBeInTheDocument();
  });

  it('проводит слово через Фазу A и Фазу B (по 1 повтору) и переводит его в Повторение', async () => {
    await db.words.add(createWord('hello', 'привет'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    // Фаза A: видно и слово, и перевод
    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    // Фаза B: виден только перевод
    expect(await screen.findByText('привет')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    expect(await screen.findByText('Новые слова выучены')).toBeInTheDocument();
    expect(screen.getByText(/Выучено слов: 1/)).toBeInTheDocument();

    const stored = await db.words.toArray();
    expect(stored[0].stage).toBe('review');
    expect(stored[0].rating).toBe(70);
  });

  it('ошибка в фазе сбрасывает phaseStreak, но не переводит слово дальше', async () => {
    await db.words.add(createWord('cat', 'кот'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('cat');
    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    // Слово остаётся в пуле (не выучено), фаза всё ещё A
    expect(await screen.findByText('cat')).toBeInTheDocument();
    const stored = await db.words.toArray();
    expect(stored[0].learningPhase).toBe('A');
    expect(stored[0].phaseStreak).toBe(0);
  });
});
```

- [ ] **Step 4: Запустить тесты**

```bash
npm run test -- src/features/newWords/NewWordsSession.test.tsx
```

Expected: PASS. Не забудь замокать confetti в тесте, если тест дойдёт до `NewWordsSummary` — добавь в начало файла:

```typescript
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
```

(добавь этот вызов в `NewWordsSession.test.tsx` до остальных импортов, сразу после `import { ... } from 'vitest'`).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add interleaved new-words learning session"
```

---

### Task 10: `ReviewSession` — сессия повторения по рейтингу

**Files:**
- Create: `src/features/review/ReviewSummary.tsx`
- Create: `src/features/review/ReviewSession.tsx`
- Test: `src/features/review/ReviewSession.test.tsx`

**Interfaces:**
- Consumes: `db` из `@/db/db`; `type Word` из `@/db/word.type`; `effectiveRating` из `@/lib/effectiveRating`; `applyReviewOutcome` из `@/lib/applyReviewOutcome`; `RecallCard` из `@/features/study/RecallCard`; `useUIStore` (`setScreen`) из `@/store/useUIStore`
- Produces: `export function ReviewSummary({ correct, almost, wrong, onFinish }: {...})`, `export function ReviewSession()`

- [ ] **Step 1: Реализовать `src/features/review/ReviewSummary.tsx`**

```tsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const CONFETTI_COLORS = ['#3f7d70', '#c9a24a', '#f5f1e4', '#2f6b5e'];

interface ReviewSummaryProps {
  correct: number;
  almost: number;
  wrong: number;
  onFinish: () => void;
}

export function ReviewSummary({ correct, almost, wrong, onFinish }: ReviewSummaryProps) {
  useEffect(() => {
    void confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
  }, []);

  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center">
      <PartyPopper className="h-7 w-7 text-status-mastered" aria-hidden="true" />
      <h2 className="text-lg font-semibold">Повторение завершено</h2>
      <div className="grid w-full grid-cols-3 gap-2 text-sm">
        <div className="flex flex-col items-center gap-1.5 rounded-md bg-secondary py-3">
          <span className="h-2 w-2 rounded-full bg-status-mastered" aria-hidden="true" />
          <p className="font-mono font-semibold">Верно: {correct}</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-md bg-secondary py-3">
          <span className="h-2 w-2 rounded-full bg-status-learning" aria-hidden="true" />
          <p className="font-mono font-semibold">Почти: {almost}</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-md bg-secondary py-3">
          <span className="h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
          <p className="font-mono font-semibold">Неверно: {wrong}</p>
        </div>
      </div>
      <Button type="button" onClick={onFinish} className="w-full">
        На главную
      </Button>
    </Card>
  );
}
```

- [ ] **Step 2: Реализовать `src/features/review/ReviewSession.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import type { Word } from '@/db/word.type';
import { effectiveRating } from '@/lib/effectiveRating';
import { applyReviewOutcome } from '@/lib/applyReviewOutcome';
import type { MatchVerdict } from '@/lib/fuzzyMatch';
import { useUIStore } from '@/store/useUIStore';
import { RecallCard } from '@/features/study/RecallCard';
import { ReviewSummary } from './ReviewSummary';

interface Counters {
  correct: number;
  almost: number;
  wrong: number;
}

export function ReviewSession() {
  const [queue, setQueue] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [counters, setCounters] = useState<Counters>({ correct: 0, almost: 0, wrong: 0 });
  const setScreen = useUIStore((s) => s.setScreen);

  useEffect(() => {
    let cancelled = false;
    void db.words
      .where('stage')
      .equals('review')
      .toArray()
      .then((words) => {
        if (cancelled) return;
        const now = Date.now();
        const sorted = [...words].sort(
          (a, b) => effectiveRating(a, now) - effectiveRating(b, now),
        );
        setQueue(sorted);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAnswer(word: Word, verdict: MatchVerdict) {
    const wordId = word.id;
    if (wordId != null) {
      const next = applyReviewOutcome(word, verdict, Date.now());
      await db.words.update(wordId, next);
    }
    setCounters((c) => ({ ...c, [verdict]: c[verdict] + 1 }));
    setIndex((i) => i + 1);
  }

  if (queue === null) {
    return <p className="text-sm text-muted-foreground">Загрузка...</p>;
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Пока нечего повторять — сначала выучите новые слова.</p>
        <Button type="button" onClick={() => setScreen('newWords')}>
          Новые слова
        </Button>
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <ReviewSummary
        correct={counters.correct}
        almost={counters.almost}
        wrong={counters.wrong}
        onFinish={() => setScreen('newWords')}
      />
    );
  }

  const current = queue[index];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-right font-mono text-xs text-muted-foreground">
        {index + 1} из {queue.length}
      </p>
      <RecallCard
        key={current.id}
        translation={current.translation}
        expectedTerm={current.term}
        onAnswer={(verdict) => void handleAnswer(current, verdict)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Написать тест на прохождение одного слова**

Создай `src/features/review/ReviewSession.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewSession } from './ReviewSession';
import { db } from '@/db/db';
import { useUIStore } from '@/store/useUIStore';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('ReviewSession', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ screen: 'review' });
  });

  it('показывает пустое состояние, если нечего повторять', async () => {
    render(<ReviewSession />);
    expect(await screen.findByText(/нечего повторять/i)).toBeInTheDocument();
  });

  it('проходит одно слово: перевод показан, слово скрыто, верный ответ обновляет рейтинг', async () => {
    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 0,
      rating: 70,
      reviewStreak: 0,
    });

    const user = userEvent.setup();
    render(<ReviewSession />);

    expect(await screen.findByText('привет')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');
    await user.click(screen.getByRole('button', { name: 'Далее' }));

    expect(await screen.findByText('Повторение завершено')).toBeInTheDocument();
    expect(screen.getByText('Верно: 1')).toBeInTheDocument();

    const stored = await db.words.toArray();
    expect(stored[0].rating).toBe(85); // 70 + 15
    expect(stored[0].reviewStreak).toBe(1);
  });
});
```

- [ ] **Step 4: Запустить тесты**

```bash
npm run test -- src/features/review/ReviewSession.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add rating-ordered review session"
```

---

### Task 11: `WordItem`/`WordList` — адаптация под stage/rating

**Files:**
- Modify: `src/features/words/WordItem.tsx`
- Modify: `src/features/words/WordList.tsx`
- Modify: `src/features/words/WordList.test.tsx`

**Interfaces:**
- Consumes: `effectiveRating` из `@/lib/effectiveRating`; `ratingColor` из `@/lib/ratingColor`; `RATING_DOT_CLASS` из `@/lib/ratingDotClass`; `RATING_TEXT_CLASS` из `@/lib/ratingTextClass`; `type Word` из `@/db/word.type`

- [ ] **Step 1: Переписать `src/features/words/WordItem.tsx`**

```tsx
import { Button } from '@/components/ui/button';
import { CARD_CLASS } from '@/lib/cardClass';
import { cn } from '@/lib/utils';
import type { Word } from '@/db/word.type';
import { effectiveRating } from '@/lib/effectiveRating';
import { ratingColor } from '@/lib/ratingColor';
import { RATING_DOT_CLASS } from '@/lib/ratingDotClass';
import { RATING_TEXT_CLASS } from '@/lib/ratingTextClass';

interface WordItemProps {
  word: Word;
  onEdit: () => void;
  onDelete: () => void;
}

export function WordItem({ word, onEdit, onDelete }: WordItemProps) {
  const badge =
    word.stage === 'new' ? (
      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
        Новое · Фаза {word.learningPhase}
      </span>
    ) : (
      (() => {
        const rating = effectiveRating(word, Date.now());
        const color = ratingColor(rating);
        return (
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className={cn('h-2 w-2 rounded-full', RATING_DOT_CLASS[color])} aria-hidden="true" />
            <span className="sr-only">Рейтинг</span>
            <span className={cn('font-mono font-medium', RATING_TEXT_CLASS[color])}>{rating}</span>
          </span>
        );
      })()
    );

  return (
    <li className={cn(CARD_CLASS, 'flex items-center justify-between p-3')}>
      <div className="flex items-center gap-3">
        {badge}
        <div>
          <p className="font-mono font-medium">{word.term}</p>
          <p className="text-sm text-muted-foreground">{word.translation}</p>
        </div>
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

- [ ] **Step 2: Переписать `src/features/words/WordList.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { db } from '@/db/db';
import type { Word } from '@/db/word.type';
import { WordForm } from './WordForm';
import { WordItem } from './WordItem';

export function WordList() {
  const words = useLiveQuery(() => db.words.toArray(), []);
  const [search, setSearch] = useState('');
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  const sorted = useMemo(
    () => [...(words ?? [])].sort((a, b) => a.term.localeCompare(b.term)),
    [words],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter(
      (w) => w.term.toLowerCase().includes(query) || w.translation.toLowerCase().includes(query),
    );
  }, [sorted, search]);

  async function handleDelete(id?: number) {
    if (id == null) return;
    await db.words.delete(id);
  }

  if (!words) {
    return <p className="text-sm text-muted-foreground">Загрузка...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {words.length === 0 ? 'Слов пока нет.' : 'Ничего не найдено.'}
        </p>
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

Обрати внимание: единственное отличие от текущей версии — убран легенд-блок статусов (new/learning/mastered), потому что новая индикация (бейдж «Новое·Фаза» либо цветная точка+число) уже самообъясняющая. `WordForm.tsx` не меняется вообще.

- [ ] **Step 3: Обновить `src/features/words/WordList.test.tsx`**

Замени фикстуры слов на новые обязательные поля (`stage`, `learningPhase`, `phaseStreak`, `rating`, `reviewStreak` вместо старых SM-2 полей). Открой текущий файл, найди функцию `baseWord`, замени её тело на:

```typescript
function baseWord(overrides: Partial<Parameters<typeof db.words.add>[0]>) {
  return {
    term: 'hello',
    translation: 'привет',
    createdAt: 0,
    stage: 'new' as const,
    learningPhase: 'A' as const,
    phaseStreak: 0,
    rating: 0,
    reviewStreak: 0,
    ...overrides,
  };
}
```

Остальные тесты в файле (список/поиск/удаление) не меняются — они не завязаны на конкретные поля SRS.

- [ ] **Step 4: Запустить тесты**

```bash
npm run test -- src/features/words/WordList.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: adapt word list/item to stage and rating display"
```

---

### Task 12: Массовое добавление — `BulkAddForm` + `AddWordPage`

**Files:**
- Create: `src/features/words/BulkAddForm.tsx`
- Create: `src/features/words/AddWordPage.tsx`
- Test: `src/features/words/BulkAddForm.test.tsx`

**Interfaces:**
- Consumes: `parseWordLines` из `@/lib/parseWordLines`; `createWord`, `db` из `@/db/db`, `@/db/createWord`; `WordForm` из `./WordForm`
- Produces: `export function BulkAddForm({ onDone }: { onDone: () => void })`, `export function AddWordPage()`

- [ ] **Step 1: Написать падающий тест для `BulkAddForm`**

Создай `src/features/words/BulkAddForm.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkAddForm } from './BulkAddForm';
import { db } from '@/db/db';

describe('BulkAddForm', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('разбирает строки, показывает превью и сохраняет все валидные пары', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<BulkAddForm onDone={onDone} />);

    await user.type(
      screen.getByLabelText('Список слов'),
      'hello - привет{Enter}cat - кот{Enter}bad line without delimiter',
    );

    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();
    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.getByText(/bad line without delimiter/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Сохранить всё' }));

    const words = await db.words.toArray();
    expect(words).toHaveLength(2);
    expect(words.map((w) => w.term).sort()).toEqual(['cat', 'hello']);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('кнопка сохранения отключена, если нет ни одной валидной пары', async () => {
    const user = userEvent.setup();
    render(<BulkAddForm onDone={vi.fn()} />);

    await user.type(screen.getByLabelText('Список слов'), 'нет разделителя вообще');

    expect(await screen.findByRole('button', { name: 'Сохранить всё' })).toBeDisabled();
  });
});
```

Запусти и убедись, что падает.

- [ ] **Step 2: Реализовать `src/features/words/BulkAddForm.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import { createWord } from '@/db/createWord';
import { parseWordLines } from '@/lib/parseWordLines';

interface BulkAddFormProps {
  onDone: () => void;
}

export function BulkAddForm({ onDone }: BulkAddFormProps) {
  const [text, setText] = useState('');

  const { valid, invalidLines } = useMemo(() => parseWordLines(text), [text]);

  async function handleSaveAll() {
    if (valid.length === 0) return;
    await db.words.bulkAdd(valid.map((line) => createWord(line.term, line.translation)));
    onDone();
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Список слов
        <textarea
          aria-label="Список слов"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={'hello - привет\ncat - кот'}
          className="w-full rounded-lg border border-input bg-transparent p-2.5 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      {valid.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {valid.map((line, i) => (
            <li key={i} className="flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1.5 text-sm">
              <span className="font-mono font-medium">{line.term}</span>
              <span className="text-muted-foreground">—</span>
              <span className="text-muted-foreground">{line.translation}</span>
            </li>
          ))}
        </ul>
      )}

      {invalidLines.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {invalidLines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Не удалось разобрать: <span className="font-mono">{line}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" onClick={() => void handleSaveAll()} disabled={valid.length === 0}>
        Сохранить всё
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Запустить тесты `BulkAddForm`**

```bash
npm run test -- src/features/words/BulkAddForm.test.tsx
```

- [ ] **Step 4: Реализовать `src/features/words/AddWordPage.tsx`**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/useUIStore';
import { WordForm } from './WordForm';
import { BulkAddForm } from './BulkAddForm';

type Mode = 'single' | 'bulk';

export function AddWordPage() {
  const [mode, setMode] = useState<Mode>('single');
  const setScreen = useUIStore((s) => s.setScreen);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button type="button" variant={mode === 'single' ? 'default' : 'outline'} size="sm" onClick={() => setMode('single')}>
          Одно слово
        </Button>
        <Button type="button" variant={mode === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setMode('bulk')}>
          Список
        </Button>
      </div>

      {mode === 'single' ? (
        <WordForm mode="create" onDone={() => setScreen('words')} />
      ) : (
        <BulkAddForm onDone={() => setScreen('words')} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Запустить полный набор тестов и сборку**

```bash
npm run test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add bulk word import with single/bulk mode toggle"
```

---

### Task 13: `SettingsPage` — настройки N/M

**Files:**
- Create: `src/features/settings/SettingsPage.tsx`
- Test: `src/features/settings/SettingsPage.test.tsx`

**Interfaces:**
- Consumes: `useUIStore` (`phaseARepeats`, `phaseBRepeats`, `setPhaseARepeats`, `setPhaseBRepeats`) из `@/store/useUIStore`

- [ ] **Step 1: Написать падающий тест**

Создай `src/features/settings/SettingsPage.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';
import { useUIStore } from '@/store/useUIStore';

describe('SettingsPage', () => {
  beforeEach(() => {
    useUIStore.setState({ phaseARepeats: 3, phaseBRepeats: 3 });
  });

  it('показывает текущие значения и обновляет их через сторy', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const phaseAInput = screen.getByLabelText(/Повторов в фазе узнавания/);
    expect(phaseAInput).toHaveValue(3);

    await user.clear(phaseAInput);
    await user.type(phaseAInput, '5');

    expect(useUIStore.getState().phaseARepeats).toBe(5);
  });
});
```

Запусти и убедись, что падает.

- [ ] **Step 2: Реализовать `src/features/settings/SettingsPage.tsx`**

```tsx
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/store/useUIStore';

export function SettingsPage() {
  const phaseARepeats = useUIStore((s) => s.phaseARepeats);
  const setPhaseARepeats = useUIStore((s) => s.setPhaseARepeats);
  const phaseBRepeats = useUIStore((s) => s.phaseBRepeats);
  const setPhaseBRepeats = useUIStore((s) => s.setPhaseBRepeats);

  function parsePositiveInt(value: string): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10 ? parsed : null;
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Повторов в фазе узнавания (слово + перевод)
        <Input
          aria-label="Повторов в фазе узнавания (слово + перевод)"
          type="number"
          min={1}
          max={10}
          value={phaseARepeats}
          onChange={(e) => {
            const value = parsePositiveInt(e.target.value);
            if (value != null) setPhaseARepeats(value);
          }}
          className="font-mono"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Повторов в фазе вспоминания (только перевод)
        <Input
          aria-label="Повторов в фазе вспоминания (только перевод)"
          type="number"
          min={1}
          max={10}
          value={phaseBRepeats}
          onChange={(e) => {
            const value = parsePositiveInt(e.target.value);
            if (value != null) setPhaseBRepeats(value);
          }}
          className="font-mono"
        />
      </label>
    </Card>
  );
}
```

- [ ] **Step 3: Запустить тесты**

```bash
npm run test -- src/features/settings/SettingsPage.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add settings screen for phase-repeat counts"
```

---

### Task 14: `NavBar` — новые 5 пунктов

**Files:**
- Modify: `src/components/layout/NavBar.tsx`

**Interfaces:**
- Consumes: `Screen` из `@/store/screen.type` (уже обновлён в Task 6)

- [ ] **Step 1: Переписать `src/components/layout/NavBar.tsx`**

```tsx
import { motion } from 'motion/react';
import { BookOpen, Layers, ListChecks, Plus, Settings } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import type { Screen } from '@/store/screen.type';

const ITEMS: { screen: Screen; label: string; icon: typeof Layers }[] = [
  { screen: 'newWords', label: 'Новые', icon: Layers },
  { screen: 'review', label: 'Повторение', icon: BookOpen },
  { screen: 'add', label: 'Добавить', icon: Plus },
  { screen: 'words', label: 'Слова', icon: ListChecks },
  { screen: 'settings', label: 'Настройки', icon: Settings },
];

export function NavBar() {
  const screen = useUIStore((s) => s.screen);
  const setScreen = useUIStore((s) => s.setScreen);

  return (
    <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-border bg-card/95 backdrop-blur px-1 py-1.5">
      {ITEMS.map((item) => {
        const active = screen === item.screen;
        const Icon = item.icon;
        return (
          <motion.button
            key={item.screen}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setScreen(item.screen)}
            className={
              'flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[11px] transition-colors ' +
              (active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')
            }
          >
            <span
              className={
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors ' +
                (active ? 'bg-primary/12' : '')
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            </span>
            {item.label}
          </motion.button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Проверить сборку**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: update NavBar for new-words/review/add/words/settings"
```

---

### Task 15: `App.tsx` + удаление старых экранов

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/features/home/Dashboard.tsx`, `src/features/home/Dashboard.test.tsx` (и папка `src/features/home/`)
- Delete: `src/features/stats/StatsPage.tsx`, `src/features/stats/StatsPage.test.tsx`, `src/features/stats/StatTile.tsx` (и папка `src/features/stats/`)
- Delete: `src/features/study/Flashcard.tsx`, `src/features/study/SessionSummary.tsx`, `src/features/study/StudySession.tsx`, `src/features/study/StudySession.test.tsx`

**Interfaces:**
- Consumes: `NewWordsSession` из `@/features/newWords/NewWordsSession`; `ReviewSession` из `@/features/review/ReviewSession`; `AddWordPage` из `@/features/words/AddWordPage`; `WordList` из `@/features/words/WordList`; `SettingsPage` из `@/features/settings/SettingsPage`

- [ ] **Step 1: Удалить старые экраны**

```bash
rm -rf src/features/home
rm -rf src/features/stats
rm src/features/study/Flashcard.tsx src/features/study/SessionSummary.tsx
rm src/features/study/StudySession.tsx src/features/study/StudySession.test.tsx
```

- [ ] **Step 2: Переписать `src/App.tsx`**

```tsx
import { useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavBar } from '@/components/layout/NavBar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { NewWordsSession } from '@/features/newWords/NewWordsSession';
import { ReviewSession } from '@/features/review/ReviewSession';
import { AddWordPage } from '@/features/words/AddWordPage';
import { WordList } from '@/features/words/WordList';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { useUIStore } from '@/store/useUIStore';

function App() {
  const screen = useUIStore((s) => s.screen);
  const theme = useUIStore((s) => s.theme);

  useLayoutEffect(() => {
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
            {screen === 'newWords' && <NewWordsSession />}
            {screen === 'review' && <ReviewSession />}
            {screen === 'add' && <AddWordPage />}
            {screen === 'words' && <WordList />}
            {screen === 'settings' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </main>
      <NavBar />
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Проверить полную сборку и полный прогон тестов**

```bash
npm run test
npm run build
npx tsc -b
```

Expected: все зелёное. Если `tsc` находит осиротевшие импорты старых модулей (Dashboard/Stats/srs/stats/mastery) — это значит какой-то файл пропущен в задачах 6–14, найди и почини именно там, а не здесь свежим кодом.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire new screens into App, remove Dashboard/Stats/old Study"
```

---

### Task 16: Финальная проверка

**Files:** без новых файлов — только верификация.

- [ ] **Step 1: Полный прогон тестов и сборки**

```bash
npm run test
npm run build
npx tsc -b
npm run lint
```

Expected: всё чисто (lint может показать 1 уже известный warning в `button.tsx` от shadcn — это норма, не трогать).

- [ ] **Step 2: Ручная проверка в браузере**

```bash
npm run dev
```

Пройти вживую: Добавить (одно слово) → Слова (видно бейдж «Новое · Фаза A») → Новые слова (пройти Фазу A нужное число раз, слово переходит в Фазу B, пройти и её — попадает в Повторение) → Повторение (слово появляется, показывается только перевод, ответить) → Слова (видно цветную точку и число рейтинга) → Настройки (поменять число повторов, убедиться что сохраняется) → Добавить → переключиться на «Список», вставить 2-3 пары через дефис, сохранить → Слова (обе пары появились).

Отдельно проверить миграцию: если в IndexedDB (Application → IndexedDB в DevTools) осталась `vocab-db` версии 1 с данными из предыдущей сессии, после `npm run dev` и открытия приложения база должна тихо апгрейднуться до версии 2 без ошибок в консоли, старые слова — появиться в «Слова» с `stage: review` и разумным `rating`.

- [ ] **Step 3: Commit (если после ручной проверки были правки)**

```bash
git add -A
git commit -m "chore: final verification pass"
```
