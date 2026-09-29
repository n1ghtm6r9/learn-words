import type { KeyValueStore } from '../keyValueStore.type';

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const entries = new Map(Object.entries(initial));
  return {
    get: async (key) => entries.get(key) ?? null,
    put: async (key, value) => {
      entries.set(key, value);
    },
  };
}
