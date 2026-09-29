import { createContext, type RefObject } from 'react';
import type { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

export const DialogActionsContext = createContext<RefObject<DialogPrimitive.Root.Actions | null> | null>(null);
