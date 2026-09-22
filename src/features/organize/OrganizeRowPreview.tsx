import { GripVertical } from 'lucide-react';

interface OrganizeRowPreviewProps {
  name: string;
  count: number;
  marker: React.ReactNode;
}

export function OrganizeRowPreview({ name, count, marker }: OrganizeRowPreviewProps) {
  return (
    <div className="flex cursor-grabbing items-center gap-2 rounded-lg border border-primary/40 bg-card px-3 py-2 shadow-xl ring-1 ring-primary/20">
      <span className="flex h-7 w-5 shrink-0 items-center justify-center text-foreground">
        <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      {marker}
      <span className="min-w-0 truncate text-sm font-medium">{name}</span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">{count}</span>
    </div>
  );
}
