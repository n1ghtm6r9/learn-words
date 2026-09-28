import type { CloudApi } from './cloudApi.type';
import { SIGN_IN_EMAIL } from './signInEmail';
import { SIGN_IN_HINTS } from './signInHints';

export async function signIn(cloud: CloudApi): Promise<void> {
  const { providers } = await cloud.getAuthProviders().catch(() => ({ providers: [] }));
  if (providers.some((provider) => provider.name === SIGN_IN_HINTS.provider)) {
    await cloud.login(SIGN_IN_HINTS);
    return;
  }
  await cloud.login(
    SIGN_IN_EMAIL
      ? { email: SIGN_IN_EMAIL, grant_type: 'otp', intent: SIGN_IN_HINTS.intent }
      : { intent: SIGN_IN_HINTS.intent },
  );
}
