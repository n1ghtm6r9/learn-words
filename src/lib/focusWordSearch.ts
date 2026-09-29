const MAX_ATTEMPTS = 60;

export function focusWordSearch(attempt = 0): void {
  requestAnimationFrame(() => {
    const input = document.getElementById('word-search');
    if (input instanceof HTMLInputElement) {
      input.focus();
      return;
    }
    if (attempt < MAX_ATTEMPTS) focusWordSearch(attempt + 1);
  });
}
