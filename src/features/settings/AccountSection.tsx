import { useObservable } from 'dexie-react-hooks';
import type { CloudApi } from '@/cloud/cloudApi.type';
import { runCloudFlow } from '@/cloud/runCloudFlow';
import { signIn } from '@/cloud/signIn';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { GuestAccount } from './account/GuestAccount';
import { SignedInAccount } from './account/SignedInAccount';

interface AccountSectionProps {
  cloud: CloudApi;
}

export function AccountSection({ cloud }: AccountSectionProps) {
  const user = useObservable(cloud.currentUser);
  const syncState = useObservable(cloud.syncState);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const t = useTranslation();

  function startFlow(flow: () => Promise<void>) {
    setSettingsOpen(false);
    void runCloudFlow(flow);
  }

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      {t.accountLabel}
      {user?.isLoggedIn ? (
        <SignedInAccount user={user} syncState={syncState} onSignOut={() => startFlow(() => cloud.logout())} />
      ) : (
        <GuestAccount onSignIn={() => startFlow(() => signIn(cloud))} />
      )}
    </div>
  );
}
