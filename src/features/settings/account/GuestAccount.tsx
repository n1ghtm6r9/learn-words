import { Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/useTranslation';

interface GuestAccountProps {
  onSignIn: () => void;
}

export function GuestAccount({ onSignIn }: GuestAccountProps) {
  const t = useTranslation();

  return (
    <>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onSignIn}>
          <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
          {t.signIn}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t.accountGuestHint}</p>
    </>
  );
}
