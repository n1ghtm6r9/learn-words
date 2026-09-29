export function hasScrolledAncestor(target: Element, boundary: Element): boolean {
  for (let element: Element | null = target; element; element = element.parentElement) {
    if (element.scrollTop > 0) return true;
    if (element === boundary) return false;
  }
  return false;
}
