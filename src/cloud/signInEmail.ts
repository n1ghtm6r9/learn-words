import { normalizeEmail } from './normalizeEmail';

export const SIGN_IN_EMAIL: string | undefined = normalizeEmail(import.meta.env.VITE_SIGN_IN_EMAIL ?? '') || undefined;
