# Мой словарь

A single-page vocabulary trainer. Add words with translations, then review
them on a spaced-repetition schedule built on a memory-stability model: each
word carries a stability (how many days until recall drops to 90%) and a
difficulty that both adapt to how you answer, so well-known words come back
far less often. Includes a flashcard study session,
a word list with search/edit/delete, and a stats page with accuracy and
activity tracking.

You can study English or Spanish: the language is picked in the settings, and each
one keeps its own dictionary, its own pronunciation voice and its own rules for
telling a word from a phrase.

Data lives in the browser (IndexedDB). Without an account the app works in guest
mode and keeps everything on the current device; signing in syncs the
vocabulary across devices through [Dexie Cloud](https://dexie.org/cloud/). Sign-in
is private: only pre-registered accounts are accepted.

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
bun install
bun run dev
```

## Sync across devices

Sync is switched on by the `VITE_DEXIE_CLOUD_URL` build-time variable; without it
the app stays local-only and the account section is hidden. Sign-in uses a code
sent by email (or Google, once it is set up in step 3–4), and each device keeps
its own session once signed in.

1. Create the cloud database (asks for your email and a one-time code; writes
   `dexie-cloud.json` and `dexie-cloud.key`, both git-ignored):

   ```bash
   bunx dexie-cloud create
   ```

2. Allow the app origins:

   ```bash
   bunx dexie-cloud whitelist https://n1ghtm6r9.github.io
   bunx dexie-cloud whitelist http://localhost:5173
   ```

3. Optional — Google sign-in. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   create an OAuth client of type *Web application* with the redirect URI
   `https://<db-id>.dexie.cloud/oauth/callback/google`. Leave the consent screen
   in *Testing* and add the allowed Gmail addresses as test users — Google then
   refuses everyone else.

4. Optional — in the Dexie Cloud Manager add the Google provider with that client ID and
   secret, and switch off email one-time codes if you want Google to be the only
   way in.

5. Register each allowed person before their first sign-in. This creates them with
   one of the free plan's 3 production seats — the app signs in with
   `intent: 'login'`, so unknown accounts are rejected — and prints the hash of
   their email:

   ```bash
   bun run cloud:allow someone@gmail.com
   ```

6. Put the values in `.env.production` (used by the deploy build; nothing in it is
   secret — the database URL ships in the page anyway) and in `.env.local` for
   local development:

   ```bash
   VITE_DEXIE_CLOUD_URL=https://<id>.dexie.cloud
   VITE_ALLOWED_EMAIL_HASHES=<hash1>,<hash2>
   VITE_SIGN_IN_EMAIL=you@example.com
   ```

   `VITE_ALLOWED_EMAIL_HASHES` takes the comma-separated hashes from step 5; any
   other account is signed straight back out. `VITE_SIGN_IN_EMAIL` is optional:
   with it the Sign in button sends the code to that address straight away
   instead of asking for an email.

Signing out removes the words from that device; they stay in the account.

## Telegram Mini App

The same deployed page runs inside Telegram (iOS, Android, macOS, Desktop) as a
Mini App. In [@BotFather](https://t.me/BotFather):

1. `/newbot` — create the bot.
2. `/mybots` → the bot → *Bot Settings* → *Menu Button* — set the URL
   `https://n1ghtm6r9.github.io/learn-words/`. Optionally `/newapp` gives it a
   direct `t.me/<bot>/<app>` link as well.

Inside Telegram the app opens full height, keeps vertical swipes for its own
gestures, matches Telegram's colours and safe areas, and follows Telegram's
light/dark scheme until a theme is picked in the settings. The Telegram SDK is
loaded only there. Telegram keeps its own storage, separate from the browser, so
sign in to get the account's words; sign-in always uses the emailed code there,
because Google refuses to sign in inside embedded web views. Each time the Mini
App comes back to the front it pulls the latest changes from the cloud.

### Export and import through the bot

Telegram web views can't download files, so the bot has a tiny server in `bot/`
(a Cloudflare Worker, free plan). `/start` or `/menu` sends a menu with
*📤 Экспорт*, *📥 Импорт* and *📚 Открыть словарь* and deletes the previous one,
so the chat keeps a single menu (its id per chat lives in the `MENUS` KV
namespace; Telegram lets a bot delete only messages younger than 48 hours):

- *Экспорт* opens the export dialog; *Отправить в чат* sends the JSON file into
  the chat with the bot and closes the Mini App. Every exported file gets an
  *📥 Импортировать* button.
- *Импорт* opens the import dialog with a file picker. Any `.json` sent or
  forwarded to the bot gets the same *📥 Импортировать* button, which opens the
  import dialog with that file already loaded.

The Worker checks Telegram's signed launch data before it sends or reads a
file, and a chat file can only be read by the user it was sent to. It keeps no
data. Setup:

```bash
bunx wrangler@4 login
bun run bot:token        # paste the bot token; stored as a Worker secret
bun run bot:deploy       # prints https://learn-words-bot.<account>.workers.dev
TELEGRAM_BOT_TOKEN=... BOT_URL=https://learn-words-bot.<account>.workers.dev bun run bot:setup
```

`bot:setup` sets the webhook, the `/menu`, `/export` and `/import` commands and
the menu button. Then put the Worker URL in `.env.production` as
`VITE_TELEGRAM_RELAY_URL`; without it export inside Telegram falls back to the
browser download.

## Testing

```bash
bun run test
```

## Building

```bash
bun run build
```
