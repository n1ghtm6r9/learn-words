import { useState } from 'react';
import { useObservable } from 'dexie-react-hooks';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { CloudApi } from '@/cloud/cloudApi.type';
import { clearAccessDenied } from '@/cloud/clearAccessDenied';
import { holdInteraction } from '@/cloud/holdInteraction';
import { releaseInteraction } from '@/cloud/releaseInteraction';
import { useCloudFlowStore } from '@/cloud/useCloudFlowStore';
import { AccessDeniedStep } from './AccessDeniedStep';
import { InteractionStep } from './InteractionStep';

interface LoginDialogProps {
  cloud: CloudApi;
}

export function LoginDialog({ cloud }: LoginDialogProps) {
  const interaction = useObservable(cloud.userInteraction);
  const awaiting = useCloudFlowStore((s) => s.awaiting);
  const denied = useCloudFlowStore((s) => s.denied === true);
  const current = interaction ?? awaiting;
  const showDenied = current === undefined && denied;
  const [displayed, setDisplayed] = useState(current);

  if (current && current !== displayed) setDisplayed(current);

  function submit(params: Record<string, string>) {
    if (!interaction) return;
    holdInteraction(interaction);
    interaction.onSubmit(params);
  }

  function dismiss() {
    releaseInteraction();
    if (interaction?.type === 'message-alert') interaction.onSubmit({});
    else interaction?.onCancel();
  }

  return (
    <Dialog
      open={current !== undefined || showDenied}
      onOpenChange={(open) => {
        if (open) return;
        if (showDenied) clearAccessDenied();
        else dismiss();
      }}
      disablePointerDismissal
    >
      <DialogContent>
        {showDenied ? (
          <AccessDeniedStep onDone={clearAccessDenied} />
        ) : (
          displayed && (
            <InteractionStep
              key={displayed.type}
              interaction={displayed}
              pending={interaction === undefined && awaiting !== undefined}
              onSubmit={submit}
              onCancel={dismiss}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
