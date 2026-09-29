export function loadSettingsPage() {
  return import('./SettingsPage').then((module) => ({ default: module.SettingsPage }));
}
