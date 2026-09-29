interface StatTileProps {
  label: string;
  value: number;
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="flex flex-col-reverse items-center gap-1 rounded-2xl bg-secondary px-2 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl leading-none font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
