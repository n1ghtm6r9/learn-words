export function loadLoginDialog() {
  return import('./LoginDialog').then((module) => ({ default: module.LoginDialog }));
}
