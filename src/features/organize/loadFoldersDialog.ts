export function loadFoldersDialog() {
  return import('./FoldersDialog').then((module) => ({ default: module.FoldersDialog }));
}
