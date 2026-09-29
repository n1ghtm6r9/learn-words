import { SegmentedControl } from '@/components/ui/segmentedControl';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';

export function KeyboardSuggestionsSection() {
  const keyboardSuggestions = useUIStore((s) => s.keyboardSuggestions);
  const setKeyboardSuggestions = useUIStore((s) => s.setKeyboardSuggestions);
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      {t.keyboardSuggestionsLabel}
      <SegmentedControl<'on' | 'off'>
        label={t.keyboardSuggestionsLabel}
        value={keyboardSuggestions ? 'on' : 'off'}
        onChange={(value) => setKeyboardSuggestions(value === 'on')}
        options={[
          { value: 'on', label: t.keyboardSuggestionsOn },
          { value: 'off', label: t.keyboardSuggestionsOff },
        ]}
      />
      <p className="text-sm font-normal text-muted-foreground">{t.keyboardSuggestionsHint}</p>
    </div>
  );
}
