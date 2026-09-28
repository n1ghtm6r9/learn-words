import type { DXCOption } from 'dexie-cloud-addon';

export function providerName(option: DXCOption): string {
  return option.displayName.replace(/^continue with\s+/i, '');
}
