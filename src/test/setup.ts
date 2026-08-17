import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (typeof window !== 'undefined' && !window.SpeechSynthesisUtterance) {
  window.SpeechSynthesisUtterance = class {
    text = '';
    lang = '';
    constructor(text: string) {
      this.text = text;
    }
  } as unknown as typeof SpeechSynthesisUtterance;
}
