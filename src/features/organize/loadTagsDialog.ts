export function loadTagsDialog() {
  return import('./TagsDialog').then((module) => ({ default: module.TagsDialog }));
}
