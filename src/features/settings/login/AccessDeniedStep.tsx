import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/i18n/useTranslation';
import { StepActions } from './StepActions';

interface AccessDeniedStepProps {
  onDone: () => void;
}

export function AccessDeniedStep({ onDone }: AccessDeniedStepProps) {
  const t = useTranslation();

  return (
    <>
      <DialogTitle>{t.inviteOnly}</DialogTitle>
      <DialogDescription>{t.accessDeniedHint}</DialogDescription>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onDone();
        }}
        className="flex flex-col gap-4"
      >
        <StepActions submitLabel={t.acknowledge} busy={false} />
      </form>
    </>
  );
}
