export function loadAddWordDialog() {
  return import('./AddWordDialog').then((module) => ({ default: module.AddWordDialog }));
}
