const NON_TEXT_INPUT_TYPES = ['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'];

export function opensKeyboard(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return !target.readOnly && !target.disabled;
  if (!(target instanceof HTMLInputElement)) return false;
  return !NON_TEXT_INPUT_TYPES.includes(target.type) && !target.readOnly && !target.disabled;
}
