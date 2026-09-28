import { useState } from 'react';
import { DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n/useTranslation';
import { CloudAlertList } from './CloudAlertList';
import { StepActions } from './StepActions';
import type { StepProps } from './stepProps.type';

export function OtpStep({ alerts, pending, onSubmit, onCancel }: StepProps) {
  const t = useTranslation();
  const [code, setCode] = useState('');

  return (
    <>
      <DialogTitle>{t.otpTitle}</DialogTitle>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ otp: code.trim() });
        }}
        className="flex flex-col gap-4"
      >
        <CloudAlertList alerts={alerts} />
        <label className="flex flex-col gap-1.5 text-sm">
          {t.otpLabel}
          <Input
            aria-label={t.otpLabel}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono tracking-widest"
          />
        </label>
        <StepActions submitLabel={t.signIn} busy={pending} cancelLabel={t.cancel} onCancel={onCancel} />
      </form>
    </>
  );
}
