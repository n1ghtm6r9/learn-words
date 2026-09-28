export function createFakeSubject<T>(initial: T) {
  let value = initial;
  const listeners = new Set<(next: T) => void>();

  return {
    getValue: () => value,
    next(next: T) {
      value = next;
      listeners.forEach((listener) => listener(next));
    },
    subscribe(listener: (next: T) => void) {
      listeners.add(listener);
      listener(value);
      return { unsubscribe: () => listeners.delete(listener) };
    },
  };
}
