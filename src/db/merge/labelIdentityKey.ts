import { normalizeTerm } from '@/lib/normalizeTerm';

export function labelIdentityKey(name: string): string {
  return normalizeTerm(name).toLocaleLowerCase();
}
