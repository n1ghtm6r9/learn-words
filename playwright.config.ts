import { defineConfig } from '@playwright/test';

const PORT = 5410;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixels: 0 },
  },
  use: {
    baseURL: `http://localhost:${PORT}/learn-words/`,
    locale: 'ru-RU',
  },
  projects: [
    {
      name: 'phone',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    {
      name: 'laptop',
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `bun run dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/learn-words/`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_DEXIE_CLOUD_URL: '',
      VITE_ALLOWED_EMAIL_HASHES: '',
      VITE_SIGN_IN_EMAIL: '',
    },
  },
});
