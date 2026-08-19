export function parsePositiveInt(value: string, min: number, max: number): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}
