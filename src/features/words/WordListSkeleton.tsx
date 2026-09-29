import { Skeleton } from '@/components/ui/skeleton';
import { CARD_CLASS } from '@/lib/cardClass';
import { cn } from '@/lib/utils';

const ROWS = Array.from({ length: 7 }, (_, index) => index);

export function WordListSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-busy="true">
      <Skeleton className="h-12 rounded-2xl md:h-10" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-full md:h-8" />
        <Skeleton className="h-10 w-28 rounded-full md:h-8" />
        <Skeleton className="h-10 w-20 rounded-full md:h-8" />
      </div>
      <ul className={cn(CARD_CLASS, 'divide-y divide-border/70 overflow-hidden')}>
        {ROWS.map((row) => (
          <li key={row} className="flex items-center gap-3 px-3.5 py-3.5 md:py-2.5">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
