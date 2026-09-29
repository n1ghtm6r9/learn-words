import { useState, type FormEvent } from 'react';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { isEmailAllowed } from '@/cloud/isEmailAllowed';
import { normalizeEmail } from '@/cloud/normalizeEmail';
import { useTranslation } from '@/i18n/useTranslation';
import { AlertMessage } from './AlertMessage';
import { CloudAlertList } from './CloudAlertList';
import { StepActions } from './StepActions';
import type { StepProps } from './stepProps.type';

export function EmailStep({ alerts, pending, onSubmit, onCancel }: StepProps) {
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [notInvited, setNotInvited] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeEmail(email);
    setChecking(true);
    const allowed = await isEmailAllowed(normalized);
    setChecking(false);
    if (allowed) onSubmit({ email: normalized });
    else setNotInvited(true);
  }

  return (
    <>
      <DialogTitle>{t.signInTitle}</DialogTitle>
      <DialogDescription>{t.signInEmailHint}</DialogDescription>
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          {t.emailLabel}
          <Input
            aria-label={t.emailLabel}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            aria-invalid={notInvited || undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setNotInvited(false);
            }}
          />
        </label>
        {notInvited && <AlertMessage tone="error">{t.inviteOnly}</AlertMessage>}
        <CloudAlertList alerts={alerts} />
        <StepActions submitLabel={t.sendCode} busy={pending || checking} cancelLabel={t.cancel} onCancel={onCancel} />
      </form>
    </>
  );
}
