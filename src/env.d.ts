interface ImportMetaEnv {
  readonly VITE_DEXIE_CLOUD_URL?: string;
  readonly VITE_ALLOWED_EMAIL_HASHES?: string;
  readonly VITE_SIGN_IN_EMAIL?: string;
  readonly VITE_TELEGRAM_RELAY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
