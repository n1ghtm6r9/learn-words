import type { CloudApi } from './cloudApi.type';

export const SIGN_IN_HINTS: NonNullable<Parameters<CloudApi['login']>[0]> = {
  provider: 'google',
  intent: 'login',
};
