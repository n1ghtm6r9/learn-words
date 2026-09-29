import { CARD_CLASS } from '@/lib/cardClass';
import { Skeleton } from '@/components/ui/skeleton';

export function StudyCardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex flex-1 flex-col justify-start gap-4 md:mx-auto md:w-full md:max-w-xl md:justify-center"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-28 rounded-lg" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className={`${CARD_CLASS} flex flex-col gap-7 p-6 pb-7 md:gap-6 md:p-8`}>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="flex min-h-32 flex-col justify-center gap-3">
          <Skeleton className="h-14 w-full rounded-2xl md:h-12" />
          <Skeleton className="h-12 w-full rounded-2xl md:h-10" />
        </div>
      </div>
    </div>
  );
}
