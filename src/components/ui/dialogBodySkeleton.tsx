import { Skeleton } from './skeleton';

export function DialogBodySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-2/5" />
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
      <Skeleton className="h-12 w-3/5" />
    </div>
  );
}
