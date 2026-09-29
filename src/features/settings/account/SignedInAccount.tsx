import type { SyncState, UserLogin } from 'dexie-cloud-addon';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/useTranslation';
import { LicenseHint } from './LicenseHint';
import { SyncStatusLine } from './SyncStatusLine';

interface SignedInAccountProps {
  user: UserLogin;
  syncState: SyncState | undefined;
  onSignOut: () => void;
}

export function SignedInAccount({ user, syncState, onSignOut }: SignedInAccountProps) {
  const t = useTranslation();

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium">{t.signedIn}</span>
          <SyncStatusLine phase={syncState?.phase} />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onSignOut}>
          {t.signOut}
        </Button>
      </div>
      <LicenseHint license={user.license} syncLicense={syncState?.license} />
      <p className="text-sm text-muted-foreground">{t.signOutHint}</p>
    </>
  );
}
