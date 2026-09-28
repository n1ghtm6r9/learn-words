import { newId } from '../newId';

export function remapIds(records: Array<{ id?: number }>): Map<number, string> {
  const remapped = new Map<number, string>();
  for (const record of records) {
    if (record.id != null) remapped.set(record.id, newId());
  }
  return remapped;
}
