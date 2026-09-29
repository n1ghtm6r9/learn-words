import { useUIStore } from '@/store/useUIStore';

export function useKeyboardSuggestionProps() {
  const enabled = useUIStore((s) => s.keyboardSuggestions);
  const toggle = enabled ? 'on' : 'off';

  return {
    autoCapitalize: 'none',
    autoComplete: toggle,
    autoCorrect: toggle,
    spellCheck: enabled,
  } as const;
}
