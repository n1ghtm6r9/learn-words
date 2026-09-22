import { useEffect, useMemo, useState } from 'react';

export function useOptimisticOrder<T extends { id?: number }>(items: T[]) {
  const [pending, setPending] = useState<number[] | null>(null);

  useEffect(() => {
    setPending(null);
  }, [items]);

  const ordered = useMemo(() => {
    if (!pending) return items;
    const byId = new Map(items.map((item) => [item.id!, item]));
    const next = pending.map((id) => byId.get(id)).filter((item): item is T => item != null);
    return next.length === items.length ? next : items;
  }, [items, pending]);

  return [ordered, setPending] as const;
}
