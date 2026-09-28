import type { DXCUserInteraction } from 'dexie-cloud-addon';
import { EmailStep } from './EmailStep';
import { LogoutConfirmationStep } from './LogoutConfirmationStep';
import { MessageAlertStep } from './MessageAlertStep';
import { MethodChoiceStep } from './MethodChoiceStep';
import { OtpStep } from './OtpStep';
import type { StepProps } from './stepProps.type';

interface InteractionStepProps extends Omit<StepProps, 'alerts'> {
  interaction: DXCUserInteraction;
}

export function InteractionStep({ interaction, ...handlers }: InteractionStepProps) {
  const props = { alerts: interaction.alerts, ...handlers };

  switch (interaction.type) {
    case 'generic':
      return interaction.options?.length ? (
        <MethodChoiceStep {...props} options={interaction.options} />
      ) : (
        <MessageAlertStep {...props} />
      );
    case 'email':
      return <EmailStep {...props} />;
    case 'otp':
      return <OtpStep {...props} />;
    case 'logout-confirmation':
      return <LogoutConfirmationStep {...props} />;
    default:
      return <MessageAlertStep {...props} />;
  }
}
