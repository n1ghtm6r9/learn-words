# Мой словарь

A single-page vocabulary trainer. Add words with translations, then review
them on a spaced-repetition schedule built on a memory-stability model: each
word carries a stability (how many days until recall drops to 90%) and a
difficulty that both adapt to how you answer, so well-known words come back
far less often. Includes a flashcard study session,
a word list with search/edit/delete, and a stats page with accuracy and
activity tracking.

All data is stored locally in the browser (IndexedDB) — there is no backend.

## Tech stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://github.com/pmndrs/zustand) for UI state
- [Dexie](https://dexie.org/) (IndexedDB) for persistent storage
- [Motion](https://motion.dev/) for animations
- [canvas-confetti](https://github.com/catdad/canvas-confetti) for session-complete celebration
- Web Speech API for word pronunciation

## Getting started

```bash
npm install
npm run dev
```

## Testing

```bash
npm run test
```

## Building

```bash
npm run build
```
