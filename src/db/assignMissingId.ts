import { newId } from './newId';

export function assignMissingId(primaryKey: unknown, record: { id?: string }): string | undefined {
  if (primaryKey != null) return undefined;
  record.id ??= newId();
  return record.id;
}
