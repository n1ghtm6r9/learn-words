import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/i18n/useTranslation';
import { CloudAlertList } from './CloudAlertList';
import { StepActions } from './StepActions';
import type { StepProps } from './stepProps.type';

export function LogoutConfirmationStep({ alerts, pending, onSubmit, onCancel }: StepProps) {
  const t = useTranslation();

  return (
    <>
      <DialogTitle>{t.signOutConfirmTitle}</DialogTitle>
      <DialogDescription>{t.signOutHint}</DialogDescription>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({});
        }}
        className="flex flex-col gap-4"
      >
        <CloudAlertList alerts={alerts} />
        <StepActions
          submitLabel={t.signOutAnyway}
          busy={pending}
          cancelLabel={t.cancel}
          onCancel={onCancel}
          destructive
        />
      </form>
    </>
  );
}
