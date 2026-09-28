export const ALLOWED_EMAIL_HASHES: string[] = (import.meta.env.VITE_ALLOWED_EMAIL_HASHES ?? '')
  .split(',')
  .map((hash) => hash.trim().toLowerCase())
  .filter((hash) => hash !== '');
