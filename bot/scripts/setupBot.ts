import { callTelegram } from '../src/telegram/callTelegram';
import { webhookSecret } from '../src/webhookSecret';

const botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
const botUrl = (process.env.BOT_URL ?? '').replace(/\/$/, '');
const appUrl = process.env.APP_URL ?? 'https://n1ghtm6r9.github.io/learn-words/';
if (!botToken || !botUrl) {
  console.error('Usage: TELEGRAM_BOT_TOKEN=... BOT_URL=https://<worker>.workers.dev bun run bot:setup');
  process.exit(1);
}

await callTelegram(botToken, 'setWebhook', {
  url: `${botUrl}/telegram`,
  secret_token: await webhookSecret(botToken),
  allowed_updates: ['message'],
});
await callTelegram(botToken, 'setMyCommands', {
  commands: [
    { command: 'menu', description: 'Меню: экспорт и импорт' },
    { command: 'export', description: 'Выгрузить словарь в этот чат' },
    { command: 'import', description: 'Загрузить словарь из файла' },
  ],
});
await callTelegram(botToken, 'setChatMenuButton', {
  menu_button: { type: 'web_app', text: 'Открыть', web_app: { url: appUrl } },
});
console.log(await callTelegram(botToken, 'getWebhookInfo', {}));
