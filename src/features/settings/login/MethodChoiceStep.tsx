import { Mail } from 'lucide-react';
import type { DXCOption } from 'dexie-cloud-addon';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/i18n/useTranslation';
import { CloudAlertList } from './CloudAlertList';
import { providerName } from './providerName';
import type { StepProps } from './stepProps.type';

interface MethodChoiceStepProps extends StepProps {
  options: DXCOption[];
}

export function MethodChoiceStep({ alerts, options, pending, onSubmit, onCancel }: MethodChoiceStepProps) {
  const t = useTranslation();

  return (
    <>
      <DialogTitle>{t.signInTitle}</DialogTitle>
      <DialogDescription>{t.signInMethodHint}</DialogDescription>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <Button
            key={`${option.name}:${option.value}`}
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onSubmit({ [option.name]: option.value })}
          >
            {option.name === 'otp' || !option.iconUrl ? (
              <Mail aria-hidden="true" />
            ) : (
              <img src={option.iconUrl} alt="" className="h-4 w-4" />
            )}
            {option.name === 'otp' ? t.continueWithEmail : t.continueWithProvider(providerName(option))}
          </Button>
        ))}
      </div>
      <CloudAlertList alerts={alerts} />
      <Button type="button" variant="ghost" onClick={onCancel}>
        {t.cancel}
      </Button>
    </>
  );
}
