import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface StatTileProps {
  icon: LucideIcon;
  iconClassName: string;
  children: ReactNode;
}

export function StatTile({ icon: Icon, iconClassName, children }: StatTileProps) {
  return (
    <Card className="flex flex-col items-center gap-1.5 p-3 text-center">
      <Icon className={`h-4 w-4 ${iconClassName}`} aria-hidden="true" />
      <p className="font-mono text-xs leading-snug text-muted-foreground">{children}</p>
    </Card>
  );
}
