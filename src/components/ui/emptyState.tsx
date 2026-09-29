import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline';
}

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, message, action, secondaryAction, children, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn(
        'flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border bg-card/60 px-8 py-12 text-center',
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-8 w-8" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <p className="max-w-xs text-[15px] text-muted-foreground text-balance">{message}</p>
      {children}
      {(action || secondaryAction) && (
        <div className={cn('flex justify-center gap-2', secondaryAction && 'w-full flex-col sm:w-auto sm:flex-row')}>
          {action && (
            <Button type="button" size="lg" variant={action.variant ?? 'default'} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button type="button" size="lg" variant={secondaryAction.variant ?? 'outline'} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
