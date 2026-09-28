import { DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/i18n/useTranslation';
import { CloudAlertList } from './CloudAlertList';
import { StepActions } from './StepActions';
import type { StepProps } from './stepProps.type';

export function MessageAlertStep({ alerts, pending, onSubmit }: StepProps) {
  const t = useTranslation();
  const failed = alerts.some((alert) => alert.type === 'error');

  return (
    <>
      <DialogTitle>{failed ? t.signInFailedTitle : t.accountLabel}</DialogTitle>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({});
        }}
        className="flex flex-col gap-4"
      >
        <CloudAlertList alerts={alerts} />
        <StepActions submitLabel={t.acknowledge} busy={pending} />
      </form>
    </>
  );
}
